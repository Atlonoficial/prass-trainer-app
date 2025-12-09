import prassTrainerLogo from "@/assets/prass-trainer-logo.png";

export const PrassTrainerLogo = ({ className = "h-16 w-auto" }: { className?: string }) => {
  return (
    <div className="flex items-center justify-center">
      <img
        src={prassTrainerLogo}
        alt="Prass Trainer Logo"
        className={className}
      />
    </div>
  );
};

// Alias para compatibilidade legada (deprecated)
export const ShapeProLogo = PrassTrainerLogo;