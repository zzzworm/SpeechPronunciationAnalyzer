class PronunciationScorer:
    def score(self, alignment_data):
        expected_phonemes = alignment_data.get("expected_phonemes", [])
        alignment = alignment_data.get("alignment", [])

        actual_phonemes = []
        for word in alignment:
            if "phonemes" not in word:
                raise ValueError(f"Missing phonemes in word: {word}")
            actual_phonemes.extend([p["phoneme"] for p in word["phonemes"]])

        accuracy = self._calculate_accuracy(expected_phonemes, actual_phonemes)

        speech_rate, pause_count, avg_phoneme_duration = self._calculate_fluency_metrics(alignment)

        error_analysis = self._analyze_errors(expected_phonemes, actual_phonemes)

        return {
            "pronunciation_accuracy": round(accuracy, 2),
            "fluency": {
                "speech_rate": round(speech_rate, 2),
                "pause_count": pause_count,
                "avg_phoneme_duration": round(avg_phoneme_duration, 3) if avg_phoneme_duration else None
            },
            "error_analysis": error_analysis
        }

    def _calculate_accuracy(self, expected, actual):
        from difflib import SequenceMatcher
        matcher = SequenceMatcher(None, expected, actual)
        return matcher.ratio()

    def _calculate_fluency_metrics(self, alignment):
        if not alignment:
            return 0, 0, 0

        start_time = alignment[0].get("start", 0)
        end_time = alignment[-1].get("end", 0)
        total_duration = max(0.001, end_time - start_time)

        total_phonemes = sum(len(word.get("phonemes", [])) for word in alignment)
        speech_rate = total_phonemes / total_duration if total_duration > 0 else 0

        pause_count = 0
        pause_threshold = 0.3
        for i in range(len(alignment) - 1):
            gap = alignment[i + 1]['start'] - alignment[i]['end']
            if gap > pause_threshold:
                pause_count += 1

        phoneme_durations = [
            p['end'] - p['start'] for word in alignment for p in word.get("phonemes", [])
            if 'start' in p and 'end' in p and p['end'] > p['start']
        ]
        avg_phoneme_duration = sum(phoneme_durations) / len(phoneme_durations) if phoneme_durations else 0

        return speech_rate, pause_count, avg_phoneme_duration

    def _analyze_errors(self, expected, actual):
        errors = []
        min_len = min(len(expected), len(actual))
        for i in range(min_len):
            if expected[i] != actual[i]:
                errors.append(f"Expected /{expected[i]}/ but got /{actual[i]}/")
        if len(expected) > len(actual):
            extra = expected[len(actual):]
            errors.extend([f"Missing phoneme /{e}/" for e in extra])
        elif len(actual) > len(expected):
            extra = actual[len(expected):]
            errors.extend([f"Unexpected phoneme /{a}/" for a in extra])
        return errors
