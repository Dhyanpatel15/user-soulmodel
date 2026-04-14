type SpinnerProps = {
  text?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
};

export default function Spinner({ text = "Loading...", size = "md", fullPage = false }: SpinnerProps) {
  const sizeMap = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-4",
  };

  const content = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizeMap[size]} border-[#e8125c] border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-sm text-gray-400 font-medium">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {content}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {content}
    </div>
  );
}