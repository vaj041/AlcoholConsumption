import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import type { AuditLog } from '../types';
import { tr } from '../i18n/tr';

const PAGE_SIZE = 20;

export default function AuditLogs() {
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'admin';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const loadLogs = async (requestedPage: number) => {
    if (!isAdmin) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.getAuditLogs(requestedPage, PAGE_SIZE);
      setLogs(response.logs);
      setTotal(response.total);
      setPage(response.page);
    } catch {
      setError(tr.audit.errorLoad());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, [isAdmin]);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateString));

  const renderDetails = (details: Record<string, unknown> | null) => {
    if (!details) {
      return '-';
    }

    return JSON.stringify(details);
  };

  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{tr.audit.title()}</h1>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <p className="text-sm text-base-content/70 mb-3">{tr.audit.description()}</p>

          {!isAdmin && (
            <div className="alert alert-warning mb-4">
              <span>{tr.audit.adminOnly()}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {isAdmin && (
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="text-sm text-base-content/70">
                {tr.audit.paginationShowing(String(showingFrom), String(showingTo), String(total))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="btn-sm"
                onClick={() => loadLogs(page)}
                disabled={isLoading}
              >
                {tr.audit.refresh()}
              </Button>
            </div>
          )}

          {isAdmin && isLoading ? (
            <div className="text-sm text-base-content/70">{tr.common.loading()}</div>
          ) : isAdmin && logs.length === 0 ? (
            <div className="text-sm text-base-content/70">{tr.audit.empty()}</div>
          ) : isAdmin ? (
            <div>
              <div className="overflow-x-auto">
                <table className="table table-zebra table-sm">
                  <thead>
                    <tr>
                      <th>{tr.audit.tableCreatedAt()}</th>
                      <th>{tr.audit.tableActor()}</th>
                      <th>{tr.audit.tableAction()}</th>
                      <th>{tr.audit.tableTarget()}</th>
                      <th>{tr.audit.tableDetails()}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>{formatDate(log.createdAt)}</td>
                        <td>{log.actorUser.email}</td>
                        <td className="font-mono text-xs">{log.action}</td>
                        <td className="text-xs">{`${log.targetType}${log.targetId ? `:${log.targetId}` : ''}`}</td>
                        <td className="font-mono text-xs max-w-lg break-all">{renderDetails(log.details)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="btn-sm"
                  onClick={() => loadLogs(Math.max(1, page - 1))}
                  disabled={isLoading || page <= 1}
                >
                  {tr.audit.paginationPrevious()}
                </Button>
                <span className="text-sm min-w-32 text-center">
                  {tr.audit.paginationPageInfo(String(page), String(totalPages))}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="btn-sm"
                  onClick={() => loadLogs(Math.min(totalPages, page + 1))}
                  disabled={isLoading || page >= totalPages}
                >
                  {tr.audit.paginationNext()}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
