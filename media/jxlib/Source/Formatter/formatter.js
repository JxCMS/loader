/*
---

name: Jx.Formatter

description: Base formatter object

license: MIT-style license.

requires:
 - Jx.Object

provides: [Jx.Formatter]

...
 */
 // $Id: formatter.js 960 2010-06-06 22:23:16Z jonlb@comcast.net $
/**
 * Class: Jx.Formatter
 *
 * Extends: <Jx.Object>
 *
 * Base class used for specific implementations to coerce data into specific formats
 *
 * Example:
 * (code)
 * (end)
 *
 * License:
 * Copyright (c) 2009, Jon Bomgardner.
 *
 * This file is licensed under an MIT style license
 */
Jx.Formatter = new Class({
    Family: 'Jx.Formatter',
    Extends: Jx.Object,

    /**
     * APIMethod: format
     * Empty method that must be overridden by subclasses to provide
     * the needed formatting functionality.
     */
    format: $empty
});