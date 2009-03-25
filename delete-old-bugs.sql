--
-- Copyright 2009 Christoph Böhme
--
-- This file is part of Openstreetbugs.
--
-- Openstreetbugs is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- Openstreetbugs is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU General Public License for more details.
--
-- You should have received a copy of the GNU General Public License
-- along with Openstreetbugs.  If not, see <http://www.gnu.org/licenses/>.
--

--
-- Add this script to your cron daemon and call it once a day to remove
-- closed bugs which are older than a week from the database.
--

DELETE FROM `bugs` WHERE `type` == 1 AND TIMESTAMPDIFF(DAY, `last_changed`, NOW()) > 7;
