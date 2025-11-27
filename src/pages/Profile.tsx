/**
 * Profile Page
 * Displays user profile using the UserProfile component
 */

import { useParams } from 'react-router-dom';
import UserProfile from '@/components/UserProfile';
import PageTransition from '@/components/PageTransition';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid User ID</h1>
            <p className="text-muted-foreground">
              Please provide a valid user ID in the URL path: /profile/user123
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">User Profile</h1>
          <p className="text-muted-foreground">Viewing profile for user: {id}</p>
        </div>
        <UserProfile userId={id} />
      </div>
    </PageTransition>
  );
}

