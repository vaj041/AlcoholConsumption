import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Button from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { tr } from '../i18n/tr';
import { translationsService, type AdminTranslationTerm } from '../services/translationsService';
import type { SupportedLanguage } from '../i18n/dictionary';

export default function Translations() {
  const PAGE_SIZE = 20;
  const authUser = useAuthStore((state) => state.user);
  const language = useSettingsStore((state) => state.language);
  const [adminLang, setAdminLang] = useState<SupportedLanguage>(language);
  const [termCode, setTermCode] = useState('');
  const [termText, setTermText] = useState('');
  const [termDescription, setTermDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [translationSuccess, setTranslationSuccess] = useState<string | null>(null);
  const [isSavingTranslation, setIsSavingTranslation] = useState(false);
  const [adminTerms, setAdminTerms] = useState<AdminTranslationTerm[]>([]);
  const [adminTermsError, setAdminTermsError] = useState<string | null>(null);
  const [isLoadingAdminTerms, setIsLoadingAdminTerms] = useState(false);
  const [savingRowCode, setSavingRowCode] = useState<string | null>(null);

  const isAdmin = authUser?.role === 'admin';

  useEffect(() => {
    setAdminLang(language);
  }, [language]);

  const loadAdminTerms = async () => {
    if (!isAdmin) {
      return;
    }

    try {
      setIsLoadingAdminTerms(true);
      setAdminTermsError(null);

      const terms = await translationsService.getAdminTerms(adminLang);
      setAdminTerms(terms);
    } catch {
      setAdminTermsError(tr.settings.translationsLoadFailed());
    } finally {
      setIsLoadingAdminTerms(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    loadAdminTerms();
  }, [isAdmin, adminLang]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, adminLang]);

  const filteredTerms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return adminTerms;
    }

    return adminTerms.filter((term) =>
      [term.code, term.text, term.description ?? ''].some((value) => value.toLowerCase().includes(query)),
    );
  }, [adminTerms, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTerms.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const paginatedTerms = filteredTerms.slice(pageStart, pageStart + PAGE_SIZE);
  const showingFrom = filteredTerms.length === 0 ? 0 : pageStart + 1;
  const showingTo = Math.min(pageStart + PAGE_SIZE, filteredTerms.length);

  const updateAdminTermText = (code: string, text: string) => {
    setAdminTerms((prev) => prev.map((term) => (term.code === code ? { ...term, text } : term)));
  };

  const handleSaveAdminTermRow = async (term: AdminTranslationTerm) => {
    const trimmedText = term.text.trim();

    if (!trimmedText) {
      setTranslationSuccess(null);
      setTranslationError(tr.settings.translationsValidationText());
      return;
    }

    try {
      setSavingRowCode(term.code);
      setTranslationError(null);
      setTranslationSuccess(null);

      await translationsService.bulkUpsert(adminLang, [
        {
          code: term.code,
          text: trimmedText,
          description: term.description ?? undefined,
        },
      ]);

      setTranslationSuccess(tr.settings.translationsSuccess());
      await loadAdminTerms();
    } catch {
      setTranslationError(tr.settings.translationsError());
    } finally {
      setSavingRowCode(null);
    }
  };

  const handleSaveTranslation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const code = termCode.trim();
    const text = termText.trim();
    const description = termDescription.trim();

    if (!code) {
      setTranslationSuccess(null);
      setTranslationError(tr.settings.translationsValidationCode());
      return;
    }

    if (!text) {
      setTranslationSuccess(null);
      setTranslationError(tr.settings.translationsValidationText());
      return;
    }

    try {
      setIsSavingTranslation(true);
      setTranslationError(null);
      setTranslationSuccess(null);

      await translationsService.bulkUpsert(adminLang, [
        {
          code,
          text,
          description: description || undefined,
        },
      ]);

      setTranslationSuccess(tr.settings.translationsSuccess());
      setTermCode('');
      setTermText('');
      setTermDescription('');
      await loadAdminTerms();
    } catch {
      setTranslationError(tr.settings.translationsError());
    } finally {
      setIsSavingTranslation(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{tr.settings.translationsTitle()}</h1>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <p className="text-sm text-base-content/70 mb-3">{tr.settings.translationsDescription()}</p>

          {!isAdmin && (
            <div className="alert alert-warning mb-4">
              <span>{tr.settings.translationsAdminOnly()}</span>
            </div>
          )}

          {isAdmin && translationSuccess && (
            <div className="alert alert-success mb-4">
              <span>{translationSuccess}</span>
            </div>
          )}

          {isAdmin && translationError && (
            <div className="alert alert-error mb-4">
              <span>{translationError}</span>
            </div>
          )}

          {isAdmin && (
            <form onSubmit={handleSaveTranslation} className="grid gap-4 max-w-2xl">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{tr.settings.translationsLanguage()}</span>
                </label>
                <select
                  className="select select-bordered"
                  value={adminLang}
                  onChange={(event) => setAdminLang(event.target.value as SupportedLanguage)}
                  disabled={isSavingTranslation}
                >
                  <option value="en">{tr.settings.languageEn()}</option>
                  <option value="cs">{tr.settings.languageCs()}</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{tr.settings.translationsCode()}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={termCode}
                  onChange={(event) => setTermCode(event.target.value)}
                  placeholder={tr.settings.translationsCodePlaceholder()}
                  disabled={isSavingTranslation}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{tr.settings.translationsText()}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={termText}
                  onChange={(event) => setTermText(event.target.value)}
                  placeholder={tr.settings.translationsTextPlaceholder()}
                  disabled={isSavingTranslation}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{tr.settings.translationsNote()}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={termDescription}
                  onChange={(event) => setTermDescription(event.target.value)}
                  placeholder={tr.settings.translationsNotePlaceholder()}
                  disabled={isSavingTranslation}
                />
              </div>

              <div>
                <Button type="submit" variant="primary" disabled={isSavingTranslation}>
                  {isSavingTranslation ? tr.settings.translationsSaving() : tr.settings.translationsSave()}
                </Button>
              </div>
            </form>
          )}

          {isAdmin && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h3 className="font-semibold">{tr.settings.translationsExistingTitle()}</h3>
                <Button
                  type="button"
                  variant="outline"
                  className="btn-sm"
                  onClick={loadAdminTerms}
                  disabled={isLoadingAdminTerms || !!savingRowCode}
                >
                  {tr.settings.translationsRefresh()}
                </Button>
              </div>

              <div className="form-control mb-3 max-w-xl">
                <label className="label">
                  <span className="label-text">{tr.settings.translationsSearch()}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={tr.settings.translationsSearchPlaceholder()}
                  disabled={isLoadingAdminTerms}
                />
              </div>

              {adminTermsError && (
                <div className="alert alert-error mb-3">
                  <span>{adminTermsError}</span>
                </div>
              )}

              {isLoadingAdminTerms ? (
                <div className="text-sm text-base-content/70">{tr.settings.translationsLoading()}</div>
              ) : filteredTerms.length === 0 ? (
                <div className="text-sm text-base-content/70">{tr.settings.translationsEmpty()}</div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra table-sm">
                      <thead>
                        <tr>
                          <th>{tr.settings.translationsTableCode()}</th>
                          <th>{tr.settings.translationsTableText()}</th>
                          <th>{tr.settings.translationsTableDescription()}</th>
                          <th>{tr.settings.translationsTableActions()}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTerms.map((term) => (
                          <tr key={term.code}>
                            <td className="font-mono text-xs">{term.code}</td>
                            <td>
                              <input
                                type="text"
                                className="input input-bordered input-sm w-full min-w-60"
                                value={term.text}
                                onChange={(event) => updateAdminTermText(term.code, event.target.value)}
                                disabled={isLoadingAdminTerms || savingRowCode === term.code}
                              />
                            </td>
                            <td className="text-xs text-base-content/70">{term.description || '-'}</td>
                            <td>
                              <Button
                                type="button"
                                variant="secondary"
                                className="btn-sm"
                                onClick={() => handleSaveAdminTermRow(term)}
                                disabled={isLoadingAdminTerms || !!savingRowCode}
                              >
                                {savingRowCode === term.code ? tr.settings.translationsSaving() : tr.settings.translationsSaveRow()}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-sm text-base-content/70">
                      {tr.settings.translationsPaginationShowing(String(showingFrom), String(showingTo), String(filteredTerms.length))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="btn-sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={safePage <= 1}
                      >
                        {tr.settings.translationsPaginationPrevious()}
                      </Button>
                      <span className="text-sm min-w-32 text-center">
                        {tr.settings.translationsPaginationPageInfo(String(safePage), String(totalPages))}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        className="btn-sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={safePage >= totalPages}
                      >
                        {tr.settings.translationsPaginationNext()}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
