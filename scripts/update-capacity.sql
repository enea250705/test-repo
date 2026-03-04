-- SQL script to update all class capacities to 5
-- This can be run directly on the production database

-- Start a transaction
BEGIN;

-- Update all classes to have capacity = 5
UPDATE "Class" SET "capacity" = 5;

-- Update the updatedAt timestamp to force cache invalidation
UPDATE "Class" SET "updatedAt" = NOW();

-- Commit the transaction
COMMIT; 