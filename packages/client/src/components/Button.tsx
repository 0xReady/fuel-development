import clsx from 'clsx';
import { ReactNode } from 'React';

interface ButtonProps {
  children: ReactNode;
  disabled?: boolean;
  onClick: any;
}
export default function Button({ children, disabled, onClick }: ButtonProps) {
  return (
    <button
      className={clsx(
        'w-full bg-green-900 text-green-100',
        'py-2 rounded-lg',
        disabled === true && 'bg-opacity-70 cursor-not-allowed',
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
