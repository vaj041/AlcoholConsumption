import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import type { User } from '../types';
import { tr } from '../i18n/tr';

export default function Users() {
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const adminCount = useMemo(() => users.filter((user) => user.role === 'admin').length, [users]);

  const loadUsers = async () => {
    if (!isAdmin) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.getUsers();
      setUsers(response);
    } catch {
      setError(tr.users.errorLoad());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [isAdmin]);

  const handleRoleChange = async (targetUser: User, nextRole: 'user' | 'admin') => {
    if (targetUser.role === nextRole) {
      return;
    }

    if (targetUser.role === 'admin' && nextRole === 'user' && adminCount <= 1) {
      setSuccess(null);
      setError(tr.users.lastAdmin());
      return;
    }

    try {
      setUpdatingUserId(targetUser.id);
      setError(null);
      setSuccess(null);

      const updatedUser = await authService.updateUserRole(targetUser.id, { role: nextRole });
      setUsers((previous) => previous.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
      setSuccess(tr.users.successUpdate());
    } catch {
      setError(tr.users.errorUpdate());
    } finally {
      setUpdatingUserId(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{tr.users.title()}</h1>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <p className="text-sm text-base-content/70 mb-3">{tr.users.description()}</p>

          {!isAdmin && (
            <div className="alert alert-warning mb-4">
              <span>{tr.users.adminOnly()}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-4">
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {isAdmin && isLoading ? (
            <div className="text-sm text-base-content/70">{tr.common.loading()}</div>
          ) : isAdmin && users.length === 0 ? (
            <div className="text-sm text-base-content/70">{tr.users.noData()}</div>
          ) : isAdmin ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>{tr.users.tableEmail()}</th>
                    <th>{tr.users.tableRole()}</th>
                    <th>{tr.users.tableCreatedAt()}</th>
                    <th>{tr.users.tableActions()}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isCurrentUser = currentUser?.id === user.id;
                    const isLastAdmin = user.role === 'admin' && adminCount <= 1;

                    return (
                      <tr key={user.id}>
                        <td>{user.email}{isCurrentUser ? ` (${tr.users.currentUser()})` : ''}</td>
                        <td>{user.role === 'admin' ? tr.users.roleAdmin() : tr.users.roleUser()}</td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td className="flex gap-2">
                          {user.role === 'user' ? (
                            <Button
                              type="button"
                              variant="secondary"
                              className="btn-sm"
                              disabled={updatingUserId !== null}
                              onClick={() => handleRoleChange(user, 'admin')}
                            >
                              {tr.users.promote()}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className="btn-sm"
                              disabled={updatingUserId !== null || isLastAdmin}
                              onClick={() => handleRoleChange(user, 'user')}
                            >
                              {tr.users.demote()}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
