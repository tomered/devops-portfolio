import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Mail, Calendar, MessageSquare, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Endorsement } from '@/api/endorsements';
import { DeleteEndorsementDialog } from './DeleteEndorsementDialog';

interface EndorsementsListProps {
    endorsements: Endorsement[];
    skillName: string;
    onDeleteEndorsement?: (endorsementId: string, email: string, otp: string) => Promise<void>;
    onRequestDeleteOTP?: (email: string, endorsementId: string) => Promise<void>;
}

export const EndorsementsList = ({
    endorsements,
    skillName,
    onDeleteEndorsement,
    onRequestDeleteOTP
}: EndorsementsListProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        endorsementId: string;
        skillName: string;
    }>({ isOpen: false, endorsementId: '', skillName: '' });
    const [deleteLoading, setDeleteLoading] = useState(false);

    if (!endorsements || endorsements.length === 0) {
        return (
            <div className="mt-4">
                <div className="text-xs text-muted-foreground">
                    No endorsements yet. Be the first to endorse this skill!
                </div>
            </div>
        );
    }

    const displayedEndorsements = showAll ? endorsements : endorsements.slice(0, 3);
    const hasMore = endorsements.length > 3;

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleDeleteClick = (endorsementId: string) => {
        setDeleteDialog({ isOpen: true, endorsementId, skillName });
    };

    const handleDeleteEndorsement = async (endorsementId: string, email: string, otp: string) => {
        if (!onDeleteEndorsement) return;

        try {
            setDeleteLoading(true);
            await onDeleteEndorsement(endorsementId, email, otp);
        } catch (error) {
            throw error; // Let the dialog handle the error
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleRequestDeleteOTP = async (email: string, endorsementId: string) => {
        if (!onRequestDeleteOTP) return;

        try {
            await onRequestDeleteOTP(email, endorsementId);
        } catch (error) {
            throw error; // Let the dialog handle the error
        }
    };

    return (
        <div className="mt-4">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
            >
                <Heart className="h-3 w-3 mr-1 text-red-500" />
                {endorsements.length} {endorsements.length === 1 ? 'endorsement' : 'endorsements'}
                {isExpanded ? (
                    <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                    <ChevronDown className="h-3 w-3 ml-1" />
                )}
            </Button>

            {isExpanded && (
                <div className="mt-3 space-y-3">
                    {displayedEndorsements.map((endorsement) => (
                        <Card key={endorsement.id} className="border-l-4 border-l-red-500">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium text-sm">{endorsement.name}</span>
                                            <Badge variant="outline" className="text-xs">
                                                <Mail className="h-2 w-2 mr-1" />
                                                {endorsement.email}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(endorsement.timestamp)}
                                        </div>
                                        {onDeleteEndorsement && onRequestDeleteOTP && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteClick(endorsement.id)}
                                                className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                                                title="Delete this endorsement (requires email verification)"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex items-start gap-2">
                                    <MessageSquare className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                                    <p className="text-sm text-muted-foreground italic">
                                        "{endorsement.message}"
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {hasMore && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAll(!showAll)}
                            className="w-full text-xs"
                        >
                            {showAll ? (
                                <>
                                    Show Less
                                    <ChevronUp className="h-3 w-3 ml-1" />
                                </>
                            ) : (
                                <>
                                    Show All {endorsements.length} Endorsements
                                    <ChevronDown className="h-3 w-3 ml-1" />
                                </>
                            )}
                        </Button>
                    )}


                </div>
            )}

            <DeleteEndorsementDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, endorsementId: '', skillName: '' })}
                endorsementId={deleteDialog.endorsementId}
                skillName={deleteDialog.skillName}
                onDelete={handleDeleteEndorsement}
                onRequestOTP={handleRequestDeleteOTP}
                isLoading={deleteLoading}
            />
        </div>
    );
}; 