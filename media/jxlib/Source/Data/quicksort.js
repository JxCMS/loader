/*
---

name: Jx.Sort.Quicksort

description: An implementation of the quick sort algorithm.

license: MIT-style license.

requires:
 - Jx.Sort

provides: [Jx.Sort.Quicksort]

...
 */
// $Id: quicksort.js 960 2010-06-06 22:23:16Z jonlb@comcast.net $
/**
 * Class: Jx.Sort.Quicksort
 *
 * Extends: <Jx.Sort>
 *
 * Implementation of a quicksort algorithm designed to
 * work on <Jx.Store> data.
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
Jx.Sort.Quicksort = new Class({
    Family: 'Jx.Sort.Quicksort',
    Extends : Jx.Sort,

    name : 'quicksort',

    /**
     * APIMethod: sort
     * Actually runs the sort on the data
     *
     * returns: the sorted data
     */
    sort : function (left, right) {
        this.fireEvent('start');

        if (!$defined(left)) {
            left = 0;
        }
        if (!$defined(right)) {
            right = this.data.length - 1;
        }

        this.quicksort(left, right);

        this.fireEvent('stop');

        return this.data;

    },

    /**
     * Method: quicksort
     * Initiates the sorting. Is
     * called recursively
     *
     * Parameters:
     * left - the left hand, or lower, bound of the sort
     * right - the right hand, or upper, bound of the sort
     */
    quicksort : function (left, right) {
        if (left >= right) {
            return;
        }

        var index = this.partition(left, right);
        this.quicksort(left, index - 1);
        this.quicksort(index + 1, right);
    },

    /**
     * Method: partition
     *
     * Parameters:
     * left - the left hand, or lower, bound of the sort
     * right - the right hand, or upper, bound of the sort
     */
    partition : function (left, right) {
        this.findMedianOfMedians(left, right);
        var pivotIndex = left;
        var pivotValue = (this.data[pivotIndex]).get(this.col);
        var index = left;
        var i;

        this.data.swap(pivotIndex, right);
        for (i = left; i < right; i++) {
            if (this.comparator((this.data[i]).get(this.col),
                    pivotValue) < 0) {
                this.data.swap(i, index);
                index = index + 1;
            }
        }
        this.data.swap(right, index);

        return index;

    },

    /**
     * Method: findMedianOfMedians
     *
     * Parameters: l
     * eft - the left hand, or lower, bound of the sort
     * right - the right hand, or upper, bound of the sort
     */
    findMedianOfMedians : function (left, right) {
        if (left === right) {
            return this.data[left];
        }

        var i;
        var shift = 1;
        while (shift <= (right - left)) {
            for (i = left; i <= right; i += shift * 5) {
                var endIndex = (i + shift * 5 - 1 < right) ? i + shift * 5 - 1 : right;
                var medianIndex = this.findMedianIndex(i, endIndex,
                        shift);

                this.data.swap(i, medianIndex);
            }
            shift *= 5;
        }

        return this.data[left];
    },

    /**
     * Method: findMedianIndex
     *
     * Parameters:
     * left - the left hand, or lower, bound of the sort
     * right - the right hand, or upper, bound of the sort
     */
    findMedianIndex : function (left, right, shift) {
        var groups = Math.round((right - left) / shift + 1);
        var k = Math.round(left + groups / 2 * shift);
        if (k > this.data.length - 1) {
            k = this.data.length - 1;
        }
        for (var i = left; i < k; i += shift) {
            var minIndex = i;
            var v = this.data[minIndex];
            var minValue = v.get(this.col);

            for (var j = i; j <= right; j += shift) {
                if (this.comparator((this.data[j]).get(this.col),
                        minValue) < 0) {
                    minIndex = j;
                    minValue = (this.data[minIndex]).get(this.col);
                }
            }
            this.data.swap(i, minIndex);
        }

        return k;
    }
});
