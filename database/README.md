# CampusHub Database Tier 🗄️

This directory encapsulates the **Data Layer** for the CampusHub platform.

## Architecture
- **Engine**: SQLite 3 (persistent file `campus_hub.db`) with Write-Ahead Logging (WAL) and foreign key constraints enabled.
- **Data Access Object (DAO)**: `db.js` provides typed query methods, transaction isolation, and model transformations for the backend REST API controllers.
- **Relational Schema**: `schema.sql` contains all DDL definitions for users, roadmaps, teams, students, communities, discussions, events, marketplace items, notifications, and chats.
- **Initial Dataset**: `seed.sql` populates the database with realistic developer roadmaps, hackathon squads, smart-match profiles, and campus feed discussions.

## Files
| File | Purpose |
|------|---------|
| `schema.sql` | SQL table schemas & relational foreign key constraints |
| `seed.sql` | SQL data fixtures for all subsystems |
| `db.js` | Node.js Data Access Object (DAO) and query interface |
| `seed.js` | Database initialization and re-seeding CLI script |
| `campus_hub.db` | SQLite binary database file (auto-generated) |

## CLI Commands
To re-seed or reset the database at any time:
```bash
node database/seed.js
# or from root:
npm run db:seed
```
