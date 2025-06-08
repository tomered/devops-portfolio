import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    text?: string;
}

export const LoadingSpinner = ({
    size = "md",
    className,
    text
}: LoadingSpinnerProps) => {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12"
    };

    return (
        <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
            <div
                className={cn(
                    "animate-spin rounded-full border-2 border-muted border-t-primary",
                    sizeClasses[size]
                )}
            />
            {text && (
                <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
            )}
        </div>
    );
};

export const LoadingDots = ({ className }: { className?: string }) => {
    return (
        <div className={cn("flex items-center space-x-1", className)}>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
    );
};

export const LoadingPulse = ({
    className,
    children
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div className={cn("animate-pulse", className)}>
            {children || (
                <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
            )}
        </div>
    );
}; 