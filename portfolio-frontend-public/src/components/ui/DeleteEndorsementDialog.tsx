import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Mail, AlertTriangle, Shield, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingDots } from '@/components/ui/loading-spinner';

interface DeleteEndorsementDialogProps {
    isOpen: boolean;
    onClose: () => void;
    endorsementId: string;
    skillName: string;
    onDelete: (endorsementId: string, email: string, otp: string) => Promise<void>;
    onRequestOTP: (email: string, endorsementId: string) => Promise<void>;
    isLoading?: boolean;
}

export const DeleteEndorsementDialog = ({
    isOpen,
    onClose,
    endorsementId,
    skillName,
    onDelete,
    onRequestOTP,
    isLoading = false
}: DeleteEndorsementDialogProps) => {
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [errors, setErrors] = useState<{ email?: string; otp?: string }>({});
    const [otpLoading, setOtpLoading] = useState(false);
    const { toast } = useToast();

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateOTP = () => {
        if (!otp.trim()) {
            setErrors(prev => ({ ...prev, otp: 'Verification code is required' }));
            return false;
        }
        if (otp.trim().length !== 6) {
            setErrors(prev => ({ ...prev, otp: 'Verification code must be 6 digits' }));
            return false;
        }
        setErrors(prev => ({ ...prev, otp: undefined }));
        return true;
    };

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setErrors(prev => ({ ...prev, email: 'Email is required' }));
            return;
        }

        if (!validateEmail(email)) {
            setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
            return;
        }

        try {
            setOtpLoading(true);
            await onRequestOTP(email.trim(), endorsementId);
            setStep('otp');
            toast({
                title: "Verification code sent! 📧",
                description: `Please check your email (${email}) for the 6-digit verification code.`,
            });
        } catch (error) {
            toast({
                title: "Failed to send verification code",
                description: "There was an error sending the verification code. Please check your email address.",
                variant: "destructive",
            });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmitDelete = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateOTP()) {
            return;
        }

        try {
            await onDelete(endorsementId, email.trim(), otp.trim());
            resetForm();
            onClose();
            toast({
                title: "Endorsement deleted",
                description: `Your endorsement for ${skillName} has been removed.`,
            });
        } catch (error: any) {
            const errorMessage = error?.message || "Invalid verification code or there was an error deleting your endorsement.";
            toast({
                title: "Delete failed",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setStep('email');
        setEmail('');
        setOtp('');
        setErrors({});
        setOtpLoading(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleBackToEmail = () => {
        setStep('email');
        setOtp('');
        setErrors(prev => ({ ...prev, otp: undefined }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step === 'email' ? (
                            <>
                                <Trash2 className="h-5 w-5 text-red-500" />
                                Delete Endorsement
                            </>
                        ) : (
                            <>
                                <Shield className="h-5 w-5 text-blue-500" />
                                Verify Your Email
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'email' ? (
                            `To delete your endorsement for ${skillName}, please enter the email address you used when endorsing.`
                        ) : (
                            `Enter the 6-digit verification code sent to ${email} to confirm the deletion.`
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                        This action cannot be undone. Your endorsement will be permanently removed.
                    </p>
                </div>

                {step === 'email' ? (
                    <form onSubmit={handleRequestOTP}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Your Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter the email you used to endorse"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setErrors(prev => ({ ...prev, email: undefined }));
                                    }}
                                    className={errors.email ? 'border-red-500' : ''}
                                    disabled={isLoading || otpLoading}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    We'll send a verification code to confirm you own this endorsement.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isLoading || otpLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={isLoading || otpLoading || !email.trim()}
                            >
                                {otpLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <LoadingDots className="scale-75" />
                                        <span>Sending Code...</span>
                                    </div>
                                ) : (
                                    'Send Verification Code'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <form onSubmit={handleSubmitDelete}>
                        <div className="grid gap-4 py-4">
                            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <p className="text-sm text-blue-800">
                                    Check your email for a 6-digit verification code. It may take a few minutes to arrive.
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="otp" className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Verification Code
                                </Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(value);
                                        if (errors.otp) setErrors(prev => ({ ...prev, otp: undefined }));
                                    }}
                                    className={`text-center text-lg tracking-widest ${errors.otp ? 'border-red-500' : ''}`}
                                    disabled={isLoading}
                                    maxLength={6}
                                />
                                {errors.otp && (
                                    <p className="text-sm text-red-500">{errors.otp}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Enter the 6-digit code sent to your email address.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBackToEmail}
                                disabled={isLoading}
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={isLoading || otp.length !== 6}
                            >
                                {isLoading ? 'Deleting...' : 'Delete Endorsement'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}; 