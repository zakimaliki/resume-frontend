'use client';

import { useRouter } from 'next/navigation';
import { authService } from '../../services/authService';
import { Button } from '../atoms/Button';

export const WarkopNavbar = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white p-4 border-b border-gray-200">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <span 
            onClick={() => router.push('/dashboard')}
            className="text-lg font-bold cursor-pointer hover:text-gray-700 transition-colors text-black"
          >
            Warkop
          </span>
          <Button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}; 