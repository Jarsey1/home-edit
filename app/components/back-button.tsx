import { ArrowLeftIcon } from "./icons";

export function BackButton({
  onClick,
  label = "Go back",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-parchment/70 text-olive transition-colors hover:border-olive/30 hover:bg-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
    >
      <ArrowLeftIcon className="h-[18px] w-[18px]" />
    </button>
  );
}
