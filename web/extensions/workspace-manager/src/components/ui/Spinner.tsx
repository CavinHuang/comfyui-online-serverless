// Spinner.tsx
import React from "react";
import ClipLoader from "react-spinners/ClipLoader";

// Define a type for the size prop
type SpinnerSize = "sm" | "md" | "lg";

// Map size variants to Tailwind CSS classes
const sizeClasses: Record<SpinnerSize, number> = {
  sm: 12,
  md: 16,
  lg: 22,
};

interface SpinnerProps {
  size?: SpinnerSize;
}

const Spinner: React.FC<SpinnerProps> = ({ size = "md" }) => {
  const spinnerSize = sizeClasses[size];

  return (
    <div
      className={`flex items-center justify-center min-h-screen ${spinnerSize}`}
    >
      <ClipLoader size={20} loading />
    </div>
  );
};

export default Spinner;
