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
-- Run this script with mysql to create the bugs table for the server-side
-- scripts of Openstreetbugs.
--


CREATE DATABASE `osb`;

CREATE TABLE `bugs` (
	`id` bigint(20) unsigned NOT NULL auto_increment,
	`lon` float default NULL,
	`lat` float default NULL,
	`text` text,
	`type` int(11) default NULL,
	`last_changed` datetime default NULL,
	PRIMARY KEY  (`id`)
);
