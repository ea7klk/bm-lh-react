import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface PasswordResetHandlerProps {
  onPasswordResetToken: (token: string) => void;
}

const PasswordResetHandler: React.FC<PasswordResetHandlerProps> = ({ onPasswordResetToken }) => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      // Pass the token to the parent component to open the modal
      onPasswordResetToken(token);
      // Navigate to home page while keeping modal state
      navigate('/', { replace: true });
    }
  }, [token, onPasswordResetToken, navigate]);

  // This component doesn't render anything, it just handles the routing
  return null;
};

export default PasswordResetHandler;