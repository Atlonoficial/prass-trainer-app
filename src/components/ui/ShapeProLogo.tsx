import prassTrainerLogo from "@/assets/prass-trainer-logo.png";

export const ShapeProLogo = ({ className = "h-16 w-auto" }: { className?: string }) => {
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

// Alias para compatibilidade
export const PrassTrainerLogo = ShapeProLogo;