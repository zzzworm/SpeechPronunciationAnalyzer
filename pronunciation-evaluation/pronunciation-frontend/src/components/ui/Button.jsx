export default function Button({
    children,
    onClick,
    disabled = false,
    variant = 'primary',
    size = 'md'
}) {
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
    };

    const sizes = {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`rounded-md font-medium transition-colors ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
        >
            {children}
        </button>
    );
}