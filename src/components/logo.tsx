export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 732 732"
      className={className}
      role="img"
      aria-label="Lingua's Academy"
    >
      <circle cx="366" cy="366" r="321" fill="#F8F8F8" />
      <circle cx="366" cy="366" r="334" fill="none" stroke="#6FC0AB" strokeWidth="26" />
      <path
        d="M186 452 C158 404, 154 350, 178 302 C212 236, 286 190, 368 184 C408 181, 446 189, 472 199"
        fill="none"
        stroke="#1A6FAF"
        strokeWidth="21"
        strokeLinecap="round"
      />
      <path
        d="M470 212 C420 194, 366 188, 322 196 C238 212, 176 268, 165 348
           C158 402, 176 454, 212 488 C221 497, 223 506, 217 519
           C207 543, 192 562, 185 572 C178 581, 184 590, 194 585
           C233 570, 269 558, 303 556 L470 556 Z"
        fill="#14C49B"
      />
      <path d="M468 224 L650 322 L468 420 Z" fill="#F52323" />
      <circle cx="396" cy="283" r="17" fill="#000000" />
    </svg>
  );
}
