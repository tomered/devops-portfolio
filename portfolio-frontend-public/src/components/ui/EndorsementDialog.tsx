import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Heart, Mail, User, MessageSquare, Shield, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingDots } from '@/components/ui/loading-spinner';

interface EndorsementDialogProps {
    isOpen: boolean;
    onClose: () => void;
    skillName: string;
    skillId: string;
    onEndorse: (name: string, email: string, message: string, otp: string) => Promise<void>;
    onRequestOTP: (email: string, skillId: string) => Promise<void>;
    isLoading?: boolean;
}

export const EndorsementDialog = ({
    isOpen,
    onClose,
    skillName,
    skillId,
    onEndorse,
    onRequestOTP,
    isLoading = false
}: EndorsementDialogProps) => {
    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [otp, setOtp] = useState('');
    const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string; otp?: string }>({});
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const { toast } = useToast();

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = () => {
        const newErrors: { name?: string; email?: string; message?: string } = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!message.trim()) {
            newErrors.message = 'Please share why you endorse this skill';
        } else if (message.trim().length < 10) {
            newErrors.message = 'Please write at least 10 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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

        if (!validateForm()) {
            return;
        }

        try {
            setOtpLoading(true);
            await onRequestOTP(email.trim(), skillId);
            setOtpSent(true);
            setStep('otp');
            toast({
                title: "Verification code sent! 📧",
                description: `Please check your email (${email}) for the 6-digit verification code.`,
            });
        } catch (error) {
            toast({
                title: "Failed to send verification code",
                description: "There was an error sending the verification code. Please try again.",
                variant: "destructive",
            });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmitEndorsement = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateOTP()) {
            return;
        }

        try {
            await onEndorse(name.trim(), email.trim(), message.trim(), otp.trim());
            resetForm();
            onClose();
            toast({
                title: "Thank you for your public endorsement! 🎉",
                description: `Your endorsement for ${skillName} is now visible to help with networking!`,
            });
        } catch (error) {
            toast({
                title: "Endorsement failed",
                description: "Invalid verification code or there was an error. Please try again.",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setStep('form');
        setName('');
        setEmail('');
        setMessage('');
        setOtp('');
        setErrors({});
        setOtpSent(false);
        setOtpLoading(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleBackToForm = () => {
        setStep('form');
        setOtp('');
        setErrors(prev => ({ ...prev, otp: undefined }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step === 'form' ? (
                            <>
                                <Heart className="h-5 w-5 text-red-500" />
                                Endorse {skillName}
                            </>
                        ) : (
                            <>
                                <Shield className="h-5 w-5 text-blue-500" />
                                Verify Your Email
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'form' ? (
                            `Share your public endorsement of ${skillName}! Your message and contact info will be visible for networking.`
                        ) : (
                            `Enter the 6-digit verification code sent to ${email} to confirm your endorsement.`
                        )}
                    </DialogDescription>
                </DialogHeader>

                {step === 'form' ? (
                    <form onSubmit={handleRequestOTP}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Your Name
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                                    }}
                                    className={errors.name ? 'border-red-500' : ''}
                                    disabled={isLoading || otpLoading}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Your Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                                    }}
                                    className={errors.email ? 'border-red-500' : ''}
                                    disabled={isLoading || otpLoading}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="message" className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Your Endorsement Message
                                </Label>
                                <Textarea
                                    id="message"
                                    placeholder="I endorse Tomer's React skills because..."
                                    value={message}
                                    onChange={(e) => {
                                        setMessage(e.target.value);
                                        if (errors.message) setErrors(prev => ({ ...prev, message: undefined }));
                                    }}
                                    className={`min-h-[100px] ${errors.message ? 'border-red-500' : ''}`}
                                    disabled={isLoading || otpLoading}
                                />
                                {errors.message && (
                                    <p className="text-sm text-red-500">{errors.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Your message will be publicly visible along with your name and email for networking purposes.
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
                                disabled={isLoading || otpLoading || !name.trim() || !email.trim() || !message.trim()}
                                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
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
                    <form onSubmit={handleSubmitEndorsement}>
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
                                onClick={handleBackToForm}
                                disabled={isLoading}
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || otp.length !== 6}
                                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                            >
                                {isLoading ? 'Publishing...' : 'Publish Endorsement'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}; 