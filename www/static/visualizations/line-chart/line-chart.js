
(function(){

    // Simple perfect line chart
    // -------------------------

    var LineChart = Datawrapper.Visualizations.LineChart = function() {};

    _.extend(LineChart.prototype, Datawrapper.Visualizations.RaphaelChart.prototype, {

        render: function(el) {
            el = $(el);
            var
            me = this;
            me.setRoot(el);

            var
            ds = me.dataset,
            bpad = me.theme.padding.bottom,
            directLabeling = me.get('direct-labeling'),
            scales = me.__scales = {
                x: me.xScale(),
                y: me.yScale()
            },
            h = me.get('force-banking') ? el.width() / me.computeAspectRatio() : me.getSize()[1],
            c;

            me.init();

            c = me.initCanvas({
                h: h,
                bpad: me.get('rotate-x-labels') ? bpad + 20 : bpad
            });

            if (me.lineLabelsVisible()) {
                c.labelWidth = 0;
                _.each(me.chart.dataSeries(), function(col) {
                    c.labelWidth = Math.max(c.labelWidth, me.labelWidth(col.name, 'series'));
                });
                if (c.labelWidth > me.theme.lineChart.maxLabelWidth) {
                    c.labelWidth = me.theme.lineChart.maxLabelWidth;
                }
                c.rpad += c.labelWidth + 20;
            }

            scales.x = scales.x.range([c.lpad+me.yAxisWidth(h)+20, c.w-c.rpad]);
            scales.y = scales.y.range([c.h-c.bpad, 5]);

            me.yAxis();

            me.xAxis();

            var all_series = me.chart.dataSeries(),
                seriesLines = this.__seriesLines = {},
                legend_y_offset = 0;

            if (!directLabeling) {
                // sort lines by last data point
                all_series = all_series.sort(function(a, b) {
                    return b.data[ds.numRows()-1] -a.data[ds.numRows()-1];
                });
            }

            // draw series lines
            _.each(all_series, function(col, index) {
                var paths = [], pts_ = [], pts = [], x, y, sw, connectMissingValuePath = [];
                _.each(col.data, function(val, i) {
                    x = scales.x(i);
                    y = scales.y(val);
                    if (isNaN(y)) {
                        if (pts.length > 0) {
                            pts_.push(pts);
                            pts = [];
                        }
                        return;
                    }
                    if (pts.length === 0 && paths.length > 0) {
                        var lp = pts_[pts_.length-1], s = lp.length-2;
                        connectMissingValuePath.push(['M', lp[s], lp[s+1], 'M', x, y]);
                    }
                    pts.push(x, y);
                });
                pts_.push(pts);
                _.each(pts_, function(pts) {
                    paths.push("M" + [pts.shift(), pts.shift()] + (me.get('smooth-lines') ? "R" : "L") + pts);
                });

                sw = me.getSeriesLineWidth(col);

                var strokeColor = me.getSeriesColor(col);

                if (!directLabeling && index > 0) {
                    strokeColor = me.theme.colors.palette[index-1];
                    me.setSeriesColor(col, strokeColor);
                }

                _.each(paths, function(path) {
                    me.registerSeriesElement(c.paper.path(path).attr({
                        'stroke-width': sw,
                        'stroke-linecap': 'round',
                        'stroke-linejoin': 'round',
                        'stroke-opacity': 1,
                        'stroke': strokeColor
                    }), col);

                    // add invisible line on top to make selection easier
                    me.registerSeriesElement(c.paper.path(path).attr({
                        'stroke-width': sw*4,
                        'stroke-opacity': 0
                    }), col);
                });

                if (me.get('connect-missing-values', false)) {
                    me.registerSeriesElement(c.paper.path(connectMissingValuePath).attr({
                        'stroke-width': sw*0.35,
                        'stroke-dasharray': '- ',
                        stroke: strokeColor
                    }), col);
                }

                if (me.lineLabelsVisible()) {
                    var div, lbl, lblx = x + 10, lbly = y, valign = 'middle';
                    if (!directLabeling) {
                        lblx += 15;
                        valign = 'top';
                        lbly = legend_y_offset;
                        div = $('<div></div>');
                        div.css({
                            background: strokeColor,
                            width: 10,
                            height: 10,
                            position: 'absolute',
                            left: x+10,
                            top: lbly+3
                        });
                        el.append(div);
                    }
                    lbl = me.label(lblx, lbly, col.name, {
                        cl: me.chart.isHighlighted(col) ? 'highlighted series' : 'series',
                        w: c.labelWidth,
                        valign: valign
                    });
                    if (!directLabeling) {
                        legend_y_offset += lbl.height()+15;
                    }
                    lbl.data('highlighted', me.chart.isHighlighted(col));
                    me.registerSeriesLabel(lbl, col);
                } // */
            });

            me.orderSeriesElements();

            if (me.theme.lineChart.hoverDotRadius) {
                this.hoverDot = c.paper.circle(0, 0, me.theme.lineChart.hoverDotRadius).hide();
            }

            if (true || me.theme.tooltips) {
                el.mousemove(_.bind(me.onMouseMove, me));
            }

            window.ds = me.dataset;
            window.vis = me;
        },

        lineLabelsVisible: function() {
            var me = this;
            return me.chart.dataSeries().length > 1 && me.chart.dataSeries().length < 10;
        },

        getDataRowByPoint: function(x, y) {
            return Math.round(this.__scales.x.invert(x-10));
        },

        showTooltip: function(series, row, x, y) {
            var me = this,
                xval = me.chart.rowLabel(row),
                yval = series.data[row],
                tt = $('.tooltip'),
                yr = me.__scales.y(yval);

            x = me.__scales.x(row);
            y = yr + me.__root.offset().top;

            if (tt) {
                $('.xval', tt).html(xval);
                $('.yval', tt).html(me.chart.formatValue(yval, true));
                if (me.chart.hasRowHeader()) {
                    $('.xlabel', tt).html(me.chart.rowHeader().name);
                }
                $('.ylabel', tt).html(series.name);

                tt.css({
                    position: 'absolute',
                    top: (y -tt.outerHeight()-10)+'px',
                    left: (x - tt.outerWidth()*0.5)+'px'
                });
                tt.show();
            }

            if (me.theme.lineChart.hoverDotRadius) {
                me.hoverDot.attr({
                    cx: x,
                    cy: yr,
                    r: me.theme.lineChart.hoverDotRadius,
                    stroke: me.getSeriesColor(series),
                    'stroke-width': 1.5,
                    fill: '#fff'
                }).data('series', series).show();
            }
        },

        getSeriesLineWidth: function(series) {
            return this.theme.lineChart.strokeWidth[this.chart.isHighlighted(series) ? 'highlight' : 'normal'];
        },

        hideTooltip: function() {
            $('.tooltip').hide();
            if (this.theme.lineHoverDotRadius) {
                this.hoverDot.hide();
            }
        },

        computeAspectRatio: function() {
            var me = this, slopes = [], M, Rx, Ry;
            _.each(me.chart.dataSeries(), function(col) {
                var lval;
                _.each(col.data, function(val, i) {
                    if (i > 0 && val != lval) {
                        slopes.push(Math.abs(val-lval));
                    }
                    lval = val;
                });
            });
            M = d3.median(slopes);
            Rx = slopes.length;
            Ry = me.__domain[1] - me.__domain[0];
            return M*Rx/Ry;
        },

        xScale: function() {
            return d3.scale.linear().domain([0, this.dataset.numRows()-1]);
        },

        yScale: function() {
            var me = this, scale,
            // find min/max value of each data series
            domain = [Number.MAX_VALUE, Number.MAX_VALUE * -1];
            _.each(me.chart.dataSeries(), function(col) {
                domain[0] = Math.min(domain[0], col._min());
                domain[1] = Math.max(domain[1], col._max());
            });
            me.__domain = domain;
            if (me.get('baseline-zero')) {
                domain[0] = 0;
            }
            scale = me.get('scale') || 'linear';
            if (scale == 'log' && domain[0] === 0) domain[0] = 0.03;
            return d3.scale[scale]().domain(domain);
        },

        yAxisWidth: function(h) {
            var me = this,
                ticks = me.getYTicks(h),
                maxw = 0;

            _.each(ticks, function(val, t) {
                val = me.chart.formatValue(val, false);
                maxw = Math.max(maxw, me.labelWidth(val));
            });
            return maxw;
        },

        yAxis: function() {
            // draw tick marks and labels
            var me = this,
                yscale = me.__scales.y,
                c = me.__canvas,
                domain = me.__domain,
                styles = me.__styles,
                ticks = me.getYTicks(c.h);

            _.each(ticks, function(val, t) {
                var y = yscale(val), x = c.lpad;
                if (val >= domain[0] && val <= domain[1]) {
                    // c.paper.text(x, y, val).attr(styles.labels).attr({ 'text-anchor': 'end' });
                    me.label(x+2, y-10, me.chart.formatValue(val, t == ticks.length-1), { align: 'left', cl: 'axis' });
                    if (me.theme.yTicks) {
                        me.path([['M', c.lpad-25, y], ['L', c.lpad-20,y]], 'tick');
                    }
                    if (me.theme.horizontalGrid) {
                        me.path([['M', c.lpad, y], ['L', c.w - c.rpad,y]], 'grid')
                            .attr(me.theme.horizontalGrid);
                    }
                }
            });

            // draw axis line
            if (domain[0] <= 0 && domain[1] >= 0) {
                y = yscale(0);
                me.path([['M', c.lpad, y], ['L', c.w - c.rpad,y]], 'axis')
                            .attr(me.theme.yAxis);
            }
        },

        xAxis: function() {
            // draw x scale labels
            var me = this, ds = me.dataset, c = me.__canvas,
                rotate45 = me.get('rotate-x-labels');
            if (me.chart.hasRowHeader()) {
                var last_label_x = -100, min_label_distance = rotate45 ? 30 : 60;
                _.each(me.chart.rowLabels(), function(val, i) {
                    var x = me.__scales.x(i), y = c.h-c.bpad+me.theme.xLabelOffset;
                    if (x - last_label_x < min_label_distance || x + min_label_distance > c.w) return;
                    last_label_x = x;
                    if (rotate45) x -= 5;
                    me.label(x, y, val, { align: 'center', cl: 'axis' + (rotate45 ? ' rotate45' : '') });
                });
            }
        },

        hoverSeries: function(series) {
            var me = this,
                seriesElements = me.__seriesElements;
            _.each(seriesElements, function(elements, key) {
                var h = !series || key == series.name;
                _.each(elements, function(el) {
                    if (el.attrs['stroke-opacity'] > 0) {
                        el.attr({
                            opacity: h ? 1 : 0.5,
                            'stroke-width': h ? me.getSeriesLineWidth(series) : 1
                        });
                    }
                });
            });

            var seriesLabels = me.__seriesLabels;
            _.each(seriesLabels, function(labels, key) {
                var h = !series || key == series.name;
                _.each(labels, function(lbl) {
                    lbl.css({ opacity: h ? 1 : 0.5 });
                    if (h) lbl.addClass('highlighted');
                });
            });
        }

    });

}).call(this);