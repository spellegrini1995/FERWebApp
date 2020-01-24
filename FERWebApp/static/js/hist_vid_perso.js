var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 600 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var svg = d3.select("#hist_density_perso")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // The scale spacing the groups:
    var x0 = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.1);

    // The scale for spacing each group's bar:
    var x1 = d3.scaleBand()
        .padding(0.05);

    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

    var z = d3.scaleOrdinal()
        .range(["#feff35", "#ff8c00"]);

    // tooltips
    var div = d3.select('#hist_density_perso').append('div')
        .attr('class', 'tooltip')
        .style('display', 'none');

    d3.csv("static/js/db/hist_vid.txt", function(d, i, columns) {
        for (var i = 1, n = columns.length; i < n; ++i) d[columns[i]] = +d[columns[i]];
        return d;
    }).then(function(data) {
        console.log("dati: ",data);
        var tot1=0
        var tot2=0
          data.forEach(function(d) {
            tot1+=parseInt(d.You)
            tot2+=parseInt(d.History)
          });

    // Create Tooltips
        var tip = d3.tip()
        .attr('class', 'd3-tip')
        .direction('e')
        .offset([0,5])
        //.data(function(d) { return keys.map(function(key) { return {key: key, value: d[key]}; }); })
        .html(function(d) {
            var tmp=tot1
            if(d.key=="History")    tmp=tot2
        //console.log(d)
            var content = "<span style='margin-left: 2.5px;'><b>Rilevazioni: </b>" + d.value + "</span><br>";
            content +="<span style='margin-left: 2.5px;'><b>Percentuale: </b>" + d3.format(".1%")(d.value/tmp) + "</span><br>";
            return content;
        });

        svg.call(tip);
        var keys = data.columns.slice(1);

        console.log('keys');
        console.log(keys);
        x0.domain(data.map(function(d) { return d.EMOTION; }));
        x1.domain(keys).rangeRound([0, x0.bandwidth()]);
        y.domain([0, 100]).nice();

        g.append("g")
            .selectAll("g")
            .data(data)
            .enter().append("g")
            .attr("class","bar")
            .attr("transform", function(d) { return "translate(" + x0(d.EMOTION) + ",0)"; })
            .selectAll("rect")
            .data(function(d) { return keys.map(function(key) { return {key: key, value: d[key]}; }); })
            .enter().append("rect")
            .attr("x", function(d) { return x1(d.key); })
            .attr("y", function(d) {
                if(d.key=="You") return y(d.value*100/tot1)
                else return y(d.value*100/tot2); })
            .attr("width", x1.bandwidth())
            .attr("height", function(d) {
             if(d.key=="You") return height - y(d.value*100/tot1)
                else return height - y(d.value*100/tot2); })
            .attr("fill", function(d) { return z(d.key); })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x0));

        g.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y).ticks(null, "s"))
            .append("text")
            .attr("x", 2)
            .attr("y", y(y.ticks().pop()) + 0.5)
            .attr("dy", "-0.6em")
            .attr("fill", "white")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start")
            .text("Percentage");

        var legend = g.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(keys.slice().reverse())
            .enter().append("g")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
            .attr("x", width - 17)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", z)
            .attr("stroke", z)
            .attr("stroke-width",2)
            .on("click",function(d) { update(d) });

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .attr("fill", "white")
            .text(function(d) { return d; });


        function mouseover(){
            div.style('display', 'inline');
        }
        function mouseout(){
            div.style('display', 'none');
        }

        var filtered = [];

        ////
        //// Update and transition on click:
        ////

        function update(d) {

            //
            // Update the array to filter the chart by:
            //

            // add the clicked key if not included:
            if (filtered.indexOf(d) == -1) {
                filtered.push(d);
                // if all bars are un-checked, reset:
                if(filtered.length == keys.length) filtered = [];
            }
            // otherwise remove it:
            else {
                filtered.splice(filtered.indexOf(d), 1);
            }

            //
            // Update the scales for each group(/states)'s items:
            //
            var newKeys = [];
            keys.forEach(function(d) {
                if (filtered.indexOf(d) == -1 ) {
                    newKeys.push(d);
                }
            })
            x1.domain(newKeys).rangeRound([0, x0.bandwidth()]);
            y.domain([0, 100]).nice();

            // update the y axis:
            svg.select(".y")
                .transition()
                .call(d3.axisLeft(y).ticks(null, "s"))
                .duration(500);


            //
            // Filter out the bands that need to be hidden:
            //
            var bars = svg.selectAll(".bar").selectAll("rect")
                .data(function(d) { return keys.map(function(key) { return {key: key, value: d[key]}; }); })

            bars.filter(function(d) {
                    return filtered.indexOf(d.key) > -1;
                })
                .transition()
                .attr("x", function(d) {
                    return (+d3.select(this).attr("x")) + (+d3.select(this).attr("width"))/2;
                })
                .attr("height",0)
                .attr("width",0)
                .attr("y", function(d) { return height; })
                .duration(500);

            //
            // Adjust the remaining bars:
            //
            bars.filter(function(d) {
                    return filtered.indexOf(d.key) == -1;
                })
                .transition()
                .attr("x", function(d) { return x1(d.key); })
                .attr("y", function(d) {
                    if(d.key=="You") return y(d.value*100/tot1)
                    else return y(d.value*100/tot2); })
                .attr("height", function(d) {
                    if(d.key=="You") return height - y(d.value*100/tot1)
                    else return height - y(d.value*100/tot2);
                })
                .attr("width", x1.bandwidth())
                .attr("fill", function(d) { return z(d.key); })
                .duration(500);


            // update legend:
            legend.selectAll("rect")
                .transition()
                .attr("fill",function(d) {
                    if (filtered.length) {
                        if (filtered.indexOf(d) == -1) {
                            return z(d);
                        }
                        else {
                            return "white";
                        }
                    }
                    else {
                        return z(d);
                    }
                })
                .duration(100);
        }
    });
