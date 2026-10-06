import React from "react";
import styles from "./Button.module.scss";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
}

const Button: React.FC<ButtonProps> = ({
  icon,
  label,
  variant = "primary",
  size = "medium",
  className = "",
  children,
  ...props
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {label && <span>{label}</span>}
      {children}
    </button>
  );
};

export default Button;