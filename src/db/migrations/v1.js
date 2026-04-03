/**
 * @module db/migrations/v1
 * @description Version 1 schema reference.
 * Actual schema is declared in pulse-db.js — this file documents the intent.
 *
 * Stores:
 *
 * tasks
 *   id          : string (UUID, primary key)
 *   title       : string
 *   body        : string
 *   status      : 'seed'|'active'|'blocked'|'snoozed'|'done'|'archived'
 *   projectId   : string|null
 *   deadline    : ISO 8601 string|null
 *   snoozedUntil: ISO 8601 string|null
 *   energy      : 'low'|'medium'|'high'
 *   recurrence  : RecurrenceRule|null
 *   position    : { x: number, y: number }
 *   tags        : string[]
 *   createdAt   : ISO 8601 string
 *   updatedAt   : ISO 8601 string
 *   -- urgency is NOT stored; computed on hydration --
 *
 * memories
 *   id          : string (same as the original task id)
 *   title       : string
 *   body        : string
 *   status      : 'done'|'archived'
 *   projectId   : string|null
 *   completedAt : ISO 8601 string
 *   energy      : string
 *   tags        : string[]
 *
 * projects
 *   id          : string (UUID)
 *   name        : string
 *   color       : string (hex)
 *   createdAt   : ISO 8601 string
 *
 * voiceNotes
 *   id          : string (UUID)
 *   taskId      : string|null
 *   transcript  : string
 *   audioId     : string (ref to audioBlobs)
 *   createdAt   : ISO 8601 string
 *
 * audioBlobs
 *   id          : string (UUID)
 *   blob        : Blob
 *
 * patterns
 *   id          : string (UUID)
 *   patternType : string
 *   description : string
 *   confidence  : number
 *   detectedAt  : ISO 8601 string
 *   userAction  : 'accepted'|'dismissed'|null
 *
 * undoHistory
 *   seq         : number (auto-increment, primary key)
 *   type        : string
 *   payload     : object
 */
