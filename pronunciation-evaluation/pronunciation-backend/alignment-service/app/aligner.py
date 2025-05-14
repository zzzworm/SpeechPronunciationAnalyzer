
from __future__ import annotations
import re


from nltk.corpus import cmudict
import logging
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import List, Tuple, Union
from fastapi import Form
from textgrid import TextGrid 
cmu=cmudict.dict()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

MFA_PRETRAINED_MODEL = "english_us_arpa"
MFA_DICTIONARY = "english_us_arpa"
MFA_OUTPUT_DIR = "mfa_outputs"


def expect(reftext: str)-> List[str]:
     
    expected:List[str]=[]
    textused=re.findall(r"\b[\w']+\b", reftext.strip().lower())
   

    for word in textused:
        if word in cmu:
          expected.extend(cmu[word][0])
     
    return expected


def _parse_textgrid(tg_path: Path) -> Tuple[List[dict]]:
    """Return (alignment, expected_phonemes) for scorer.py."""
    tg = TextGrid.fromFile(str(tg_path))

    phone_tier = next(t for t in tg if "phon" in t.name.lower())
    word_tier = next(t for t in tg if "word" in t.name.lower())

    alignment: List[dict] = []
    phone_i = 0

    for w in word_tier.intervals:
        if not (word := w.mark.strip()):
            continue 

        word_dict = {
            "word": word,
            "start": w.minTime,
            "end": w.maxTime,
            "phonemes": []
        }

        while phone_i < len(phone_tier.intervals):
            p = phone_tier.intervals[phone_i]
            if p.maxTime - w.maxTime > 1e-4:  
                break
            label = p.mark.strip()
            if label and label not in {"sil", "sp"}:
                word_dict["phonemes"].append(
                    {"phoneme": label, "start": p.minTime, "end": p.maxTime}
                )
            phone_i += 1

        alignment.append(word_dict)

    return alignment


class PhonemeAligner:
    """Public API: align_audio_with_text(audio, text) → JSON ready for /score."""


    @staticmethod
    def _as_bytes(src: Union[bytes, str, Path]) -> bytes:
        if isinstance(src, (bytes, bytearray)):
            return src
        return Path(src).read_bytes()

    @staticmethod
    def _write_corpus(audio: bytes, text: str, corpus: Path) -> None:
        corpus.mkdir(parents=True, exist_ok=True)
        (corpus / "utt.wav").write_bytes(audio)
        (corpus / "utt.lab").write_text(text.strip(), encoding="utf8")

    def _run_mfa(self, corpus: Path) -> Path:
        out_dir = Path(MFA_OUTPUT_DIR) / uuid.uuid4().hex
        out_dir.mkdir(parents=True, exist_ok=True)

        cmd = [
            "mfa", "align",
            str(corpus),
            MFA_DICTIONARY,
            MFA_PRETRAINED_MODEL,
            str(out_dir),
            "--clean", "--quiet"
        ]
        logger.info("Running MFA …")
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode:
            logger.error("MFA error:\n%s", proc.stderr)
            raise RuntimeError("MFA alignment failed")

        grids = list(out_dir.rglob("*.TextGrid"))
        if not grids:
            raise FileNotFoundError("No TextGrid produced")
        return grids[0]
    
    def align_audio_with_text(self, audio: Union[bytes, str, Path], text: str, reftext:str) -> dict:
        audio_bytes = self._as_bytes(audio)

        with tempfile.TemporaryDirectory(prefix="mfa_corpus_") as tmp:
            corpus = Path(tmp)
            self._write_corpus(audio_bytes, text,corpus)
            tg_path = self._run_mfa(corpus)
            alignment = _parse_textgrid(tg_path)
            expected=expect(reftext)

        return {
            "alignment": alignment,
            "expected_phonemes": expected,
            "alignment_textgrid_path": str(tg_path)
        }
