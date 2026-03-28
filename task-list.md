# Task list for follow-up agent

Source context: PR #1 in vaj041/AlcoholConsumption
Date: 2026-03-21

## 1. Documentation and local run
- [ ] Check that the repository has a clear README.md
- [ ] Add local run steps for frontend and backend
- [ ] Document required environment variables
- [ ] Document Prisma setup:
  - [ ] install
  - [ ] migrate
  - [ ] generate
  - [ ] seed, if present
- [ ] Verify a new developer can set up the project without manual hidden steps

## 2. Repository hygiene
- [ ] Check that no secrets are committed
- [ ] Check that no .env files with credentials are committed
- [ ] Check that no build artifacts are committed
- [ ] Check that no user-specific IDE/config files are committed
- [ ] Review and improve .gitignore if needed

## 3. Backend authentication
- [ ] Review /auth/register
- [ ] Review /auth/login
- [ ] Review /auth/me
- [ ] Verify password hashing
- [ ] Verify JWT handling:
  - [ ] token creation
  - [ ] token verification
  - [ ] expiration handling
  - [ ] invalid token behavior
- [ ] Verify protected endpoints reject unauthenticated access correctly

## 4. Backend authorization and user data isolation
- [ ] Verify all non-auth endpoints are protected
- [ ] Verify queries are scoped by userId
- [ ] Verify one user cannot read another user's drinks
- [ ] Verify one user cannot update another user's drinks
- [ ] Verify one user cannot delete another user's drinks
- [ ] Verify one user cannot read another user's entries
- [ ] Verify stats only use data for the authenticated user

## 5. Backend CRUD and validation
- [ ] Review drinks CRUD
- [ ] Review entries operations
- [ ] Verify validation for:
  - [ ] name
  - [ ] volumeMl > 0
  - [ ] alcoholPct in a valid range
  - [ ] quantity > 0
  - [ ] valid date values
- [ ] Verify behavior for missing or invalid IDs
- [ ] Verify proper HTTP status codes
- [ ] Verify a consistent error response format

## 6. Backend statistics and alcohol calculations
- [ ] Verify pure alcohol calculation
- [ ] Verify the same formula is used consistently
- [ ] Verify aggregations for:
  - [ ] last 7 days
  - [ ] last 30 days
  - [ ] custom range
- [ ] Verify edge cases:
  - [ ] empty data
  - [ ] single-day range
  - [ ] invalid interval
  - [ ] timezone/date handling

## 7. Database and Prisma
- [ ] Review schema.prisma
- [ ] Verify relations between User, Drink, and Entry
- [ ] Verify required vs nullable fields
- [ ] Verify unique email handling
- [ ] Verify migrations
- [ ] Verify database files are not committed by mistake unless intentional

## 8. Frontend auth flow
- [ ] Review login page
- [ ] Review register page
- [ ] Verify token storage behavior
- [ ] Verify logout behavior
- [ ] Verify redirect after login
- [ ] Verify expired token behavior
- [ ] Verify protected pages are not accessible without login

## 9. Frontend UX and forms
- [ ] Review drinks form
- [ ] Review entries form
- [ ] Improve frontend validation where needed
- [ ] Verify backend errors are shown to the user clearly
- [ ] Verify loading/error/empty states
- [ ] Review component naming and structure consistency

## 10. Architecture and maintainability
- [ ] Review frontend/backend project structure
- [ ] Review naming conventions
- [ ] Review separation of route/controller/business logic responsibilities
- [ ] Identify duplication
- [ ] Identify refactor candidates
- [ ] Add TODO notes where scaffolding exists instead of finished implementation

## 11. Testing
- [ ] Check whether tests exist
- [ ] If not, add at least minimal smoke coverage for critical flows
- [ ] Test:
  - [ ] registration
  - [ ] login
  - [ ] drink creation
  - [ ] entry creation
  - [ ] stats retrieval
  - [ ] access control between two users

## 12. Future PR hygiene
- [ ] Update PR title and description to match actual scope
- [ ] Keep future PRs smaller and more reviewable
- [ ] Add a PR checklist/template if useful
