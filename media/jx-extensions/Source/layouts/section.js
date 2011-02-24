/*
---

name: Jx.Section

description: Admin component for managing modules

license: MIT-style license.

requires:
 - jxlib/Jx.Widget
 - jxlib/Jx.Slide

provides: [Jx.Section]

...
 */

Jx.Section = new Class({

    Family: 'Jx.Section',
    Extends: Jx.Widget,

    options: {
        template: '<div class="jxSection"><div class="jxSectionHeader"></div><div class="jxSectionBody"></div></div>',
        heading: null,
        body: null,
        hideBody: false,
        parent: null,
        headingClass: null,
        bodyClass: null
    },

    classes: new Hash({
        domObj: 'jxSection',
        header: 'jxSectionHeader',
        body: 'jxSectionBody'
    }),

    render: function () {
        this.parent();

        if (this.header) {
            if ($defined(this.options.headingClass)) {
                this.body.addClass(this.options.headingClass);
            }
            if ($defined(this.options.heading)) {
                if (Jx.type(this.options.heading) === 'string') {
                    this.header.set('html', this.options.heading);
                } else {
                    document.id(this.options.heading).inject(this.header);
                }
            }
        }

        if (this.body) {
            if ($defined(this.options.bodyClass)) {
                this.body.addClass(this.options.bodyClass);
            }
            if ($defined(this.options.body)) {
                if (Jx.type(this.options.body) === 'string') {
                    this.body.set('html', this.options.body);
                } else {
                    document.id(this.options.body).inject(this.body);
                }
            }
            this.slide = new Jx.Slide({
                target: this.body,
                trigger: this.header
            });
            if (this.options.hideBody) {
                this.slide.slide('out');
            }

        }

        if ($defined(this.options.parent)) {
            this.addTo(this.options.parent);
        }
    }
});
