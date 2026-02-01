/**
 * Modal for claiming items with verification and OTP
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  ShieldCheckIcon, 
  DevicePhoneMobileIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import type { Item, ClaimRequest, OTPVerifyRequest } from '@/types';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  onClaimSuccess?: () => void;
}

type ClaimStep = 'details' | 'verification' | 'otp' | 'success';

interface ClaimForm {
  phone_number?: string;
  hidden_detail_1?: string;
  hidden_detail_2?: string;
}

interface OTPForm {
  otp_code: string;
}

export function ClaimModal({ isOpen, onClose, item, onClaimSuccess }: ClaimModalProps) {
  const [currentStep, setCurrentStep] = useState<ClaimStep>('details');
  const [claimId, setClaimId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const claimForm = useForm<ClaimForm>();
  const otpForm = useForm<OTPForm>();

  const resetModal = () => {
    setCurrentStep('details');
    setClaimId('');
    claimForm.reset();
    otpForm.reset();
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Step 1: Claim Details
  const handleClaimSubmit = async (data: ClaimForm) => {
    if (!item) return;

    try {
      setIsSubmitting(true);

      const claimData: ClaimRequest = {
        item_id: item.id,
        verification_responses: {
          ...(data.hidden_detail_1 && { detail_1: data.hidden_detail_1 }),
          ...(data.hidden_detail_2 && { detail_2: data.hidden_detail_2 }),
        },
        phone_number: data.phone_number,
      };

      const response = await api.createClaim(claimData);
      setClaimId(response.claim_id);
      
      toast.success('Claim submitted! Check your phone for OTP.');
      setCurrentStep('otp');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: OTP Verification
  const handleOTPSubmit = async (data: OTPForm) => {
    if (!claimId) return;

    try {
      setIsSubmitting(true);

      const otpData: OTPVerifyRequest = {
        claim_id: claimId,
        otp_code: data.otp_code,
      };

      const response = await api.verifyOTP(otpData);
      
      toast.success('Claim verified successfully!');
      setCurrentStep('success');
      onClaimSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed');
      otpForm.setError('otp_code', { message: 'Invalid OTP code' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'details':
        return (
          <form onSubmit={claimForm.handleSubmit(handleClaimSubmit)} className="space-y-6">
            <div className="text-center">
              <ShieldCheckIcon className="mx-auto h-16 w-16 text-blue-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Claim This Item
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Please provide verification details to prove ownership
              </p>
            </div>

            {item && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Item Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><strong>Product:</strong> {item.product}</div>
                    {item.brand && <div><strong>Brand:</strong> {item.brand}</div>}
                    {item.color && <div><strong>Color:</strong> {item.color}</div>}
                    <div><strong>Description:</strong> {item.description}</div>
                    <div><strong>Type:</strong> {item.type}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Input
              label="Phone Number (for OTP)"
              type="tel"
              placeholder="+91 9876543210"
              {...claimForm.register('phone_number')}
              helpText="We'll send an OTP to verify your claim"
            />

            <Input
              label="Additional Detail 1 (Optional)"
              type="text"
              placeholder="Any unique feature or detail about the item"
              {...claimForm.register('hidden_detail_1')}
              helpText="This helps verify your ownership"
            />

            <Input
              label="Additional Detail 2 (Optional)"
              type="text"
              placeholder="Serial number, scratches, etc."
              {...claimForm.register('hidden_detail_2')}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                isLoading={isSubmitting}
                loadingText="Submitting..."
              >
                Submit Claim
              </Button>
            </div>
          </form>
        );

      case 'otp':
        return (
          <form onSubmit={otpForm.handleSubmit(handleOTPSubmit)} className="space-y-6">
            <div className="text-center">
              <DevicePhoneMobileIcon className="mx-auto h-16 w-16 text-blue-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Enter Verification Code
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                We've sent a 6-digit code to your phone number
              </p>
            </div>

            <Input
              label="OTP Code"
              type="text"
              placeholder="123456"
              maxLength={6}
              {...otpForm.register('otp_code', { 
                required: 'OTP code is required',
                pattern: {
                  value: /^\d{6}$/,
                  message: 'Please enter a valid 6-digit code'
                }
              })}
              error={otpForm.formState.errors.otp_code?.message}
              autoFocus
            />

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCurrentStep('details')}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                isLoading={isSubmitting}
                loadingText="Verifying..."
              >
                Verify Code
              </Button>
            </div>
          </form>
        );

      case 'success':
        return (
          <div className="text-center space-y-6">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Claim Verified Successfully!
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Your claim has been verified. The item owner will be notified to arrange handover.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="text-left space-y-3 text-sm">
                  <div><strong>Next Steps:</strong></div>
                  <div>1. Wait for the owner to contact you</div>
                  <div>2. Arrange a safe meeting location</div>
                  <div>3. Complete the handover process</div>
                  <div>4. Escrow payment will be processed</div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={currentStep === 'success' ? '' : 'Claim Item'}
      maxWidth="lg"
    >
      {renderStepContent()}
    </Modal>
  );
}