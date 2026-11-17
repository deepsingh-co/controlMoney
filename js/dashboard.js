/* SmartExpense dashboard: summary stats, recent transactions, and theme-aware charts. */
(function () {
  "use strict";

  var CATEGORY_META = {
    Food: { icon: "i-food", className: "food" },
    Travel: { icon: "i-travel", className: "travel" },
    Shopping: { icon: "i-shopping", className: "shopping" },
    Utilities: { icon: "i-utilities", className: "utilities" },
    Bank: { icon: "i-bank", className: "bank" },
    Other: { icon: "i-other", className: "other" },
  };

  var CATEGORY_COLORS = {
    dark: {
      Food: "#34d399",
      Travel: "#60a5fa",
      Shopping: "#a78bfa",
      Utilities: "#fbbf24",
      Bank: "#22d3ee",
      Other: "#f472b6",
    },
    light: {
      Food: "#047857",
      Travel: "#1d4ed8",
      Shopping: "#7c3aed",
      Utilities: "#b45309",
      Bank: "#0e7490",
      Other: "#be185d",
    },
  };

  var moneyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
  var moneyExactFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  var compactMoneyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  });
  var compactNumberFormatter = new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  var dateFormatter = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  var shortMonthFormatter = new Intl.DateTimeFormat("en-IN", { month: "short" });
  var monthYearFormatter = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  });
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var charts = [];
  var visibleCount = 6;

  function byId(id) {
    return document.getElementById(id);
  }

  function formatMoney(value) {
    return Number.isInteger(value)
      ? moneyFormatter.format(value)
      : moneyExactFormatter.format(value);
  }

  function formatShare(value, total) {
    if (!total) return "0%";
    var percent = (value / total) * 100;
    if (percent > 0 && percent < 1) return "<1%";
    return Math.round(percent) + "%";
  }

  function parseDate(value) {
    if (typeof value !== "string") return null;
    var match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return null;
    var date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function loadExpenses() {
    var stored;
    try {
      stored = JSON.parse(localStorage.getItem("expenses") || "[]");
    } catch (error) {
      stored = [];
    }
    if (!Array.isArray(stored)) return [];

    return stored
      .map(function (expense, index) {
        if (!expense) return null;
        var amount = Number(expense.amount);
        var date = parseDate(expense.date);
        if (!Number.isFinite(amount) || amount <= 0 || !date) return null;

        var category = Object.prototype.hasOwnProperty.call(CATEGORY_META, expense.category)
          ? expense.category
          : "Other";
        return {
          amount: amount,
          category: category,
          date: date,
          description:
            typeof expense.description === "string" ? expense.description.trim() : "",
          index: index,
        };
      })
      .filter(Boolean);
  }

  function isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function relativeDateLabel(date) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isSameDay(date, today)) return "Today";
    var yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(date, yesterday)) return "Yesterday";
    return dateFormatter.format(date);
  }

  function getPalette() {
    var light = document.documentElement.getAttribute("data-theme") === "light";
    if (light) {
      return {
        fg: "#0f172a",
        muted: "#3f4c63",
        subtle: "#52627a",
        grid: "rgba(15, 23, 42, 0.08)",
        tooltipBg: "rgba(255, 255, 255, 0.98)",
        tooltipBorder: "rgba(15, 23, 42, 0.14)",
        panel: "#ffffff",
        brand: "#1d4ed8",
        accent: "#047857",
        danger: "#b91c1c",
        categories: CATEGORY_COLORS.light,
      };
    }
    return {
      fg: "#f8fafc",
      muted: "#b5c2d4",
      subtle: "#94a3b8",
      grid: "rgba(255, 255, 255, 0.07)",
      tooltipBg: "rgba(15, 23, 42, 0.97)",
      tooltipBorder: "rgba(255, 255, 255, 0.16)",
      panel: "#111b2e",
      brand: "#60a5fa",
      accent: "#34d399",
      danger: "#f87171",
      categories: CATEGORY_COLORS.dark,
    };
  }

  function createIcon(iconId) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#" + iconId);
    svg.appendChild(use);
    return svg;
  }

  function renderGreeting() {
    var greeting = byId("greeting");
    if (!greeting) return;
    var hour = new Date().getHours();
    var label = "Good evening";
    if (hour < 12) label = "Good morning";
    else if (hour < 17) label = "Good afternoon";
    greeting.textContent = label + ".";
  }

  function renderStats(expenses) {
    var now = new Date();
    var total = 0;
    var todayTotal = 0;
    var todayCount = 0;
    var monthTotal = 0;
    var monthCount = 0;
    var previousMonthTotal = 0;

    expenses.forEach(function (expense) {
      total += expense.amount;

      if (isSameDay(expense.date, now)) {
        todayTotal += expense.amount;
        todayCount += 1;
      }

      if (
        expense.date.getFullYear() === now.getFullYear() &&
        expense.date.getMonth() === now.getMonth()
      ) {
        monthTotal += expense.amount;
        monthCount += 1;
      }

      var previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      if (
        expense.date.getFullYear() === previousMonth.getFullYear() &&
        expense.date.getMonth() === previousMonth.getMonth()
      ) {
        previousMonthTotal += expense.amount;
      }
    });

    var totalEl = byId("totalSpent");
    if (totalEl) totalEl.textContent = formatMoney(total);
    var totalMeta = byId("totalMeta");
    if (totalMeta) {
      totalMeta.textContent = expenses.length
        ? expenses.length + (expenses.length === 1 ? " transaction recorded" : " transactions recorded")
        : "No expenses yet";
    }

    var todayEl = byId("todaySpent");
    if (todayEl) todayEl.textContent = formatMoney(todayTotal);
    var todayMeta = byId("todayMeta");
    if (todayMeta) {
      todayMeta.textContent = todayCount
        ? todayCount + (todayCount === 1 ? " transaction today" : " transactions today")
        : "No spending yet today";
    }

    var monthEl = byId("monthSpent");
    if (monthEl) monthEl.textContent = formatMoney(monthTotal);
    var monthCountEl = byId("monthCount");
    if (monthCountEl) {
      monthCountEl.textContent = monthCount
        ? "· " + monthCount + (monthCount === 1 ? " transaction" : " transactions")
        : "";
    }

    var chip = byId("monthTrend");
    if (chip) {
      chip.classList.remove("is-good", "is-bad");
      if (!monthTotal && !previousMonthTotal) {
        chip.textContent = "No spending yet";
      } else if (!previousMonthTotal) {
        chip.textContent = "First month of data";
      } else {
        var change = ((monthTotal - previousMonthTotal) / previousMonthTotal) * 100;
        var rounded = Math.round(Math.abs(change));
        if (rounded === 0) {
          chip.textContent = "Level with last month";
        } else if (change > 0) {
          chip.textContent = "Up " + rounded + "% vs last month";
          chip.classList.add("is-bad");
        } else {
          chip.textContent = "Down " + rounded + "% vs last month";
          chip.classList.add("is-good");
        }
      }
    }

    var categoryTotals = {};
    expenses.forEach(function (expense) {
      categoryTotals[expense.category] =
        (categoryTotals[expense.category] || 0) + expense.amount;
    });
    var topEntry = Object.keys(categoryTotals)
      .map(function (name) {
        return { name: name, value: categoryTotals[name] };
      })
      .sort(function (a, b) {
        return b.value - a.value;
      })[0];

    var topCategoryEl = byId("topCategory");
    var topCategoryMeta = byId("topCategoryMeta");
    var topCategoryIcon = byId("topCategoryIcon");
    if (topEntry) {
      if (topCategoryEl) topCategoryEl.textContent = topEntry.name;
      if (topCategoryMeta) {
        topCategoryMeta.textContent = formatMoney(topEntry.value) + " all time";
      }
      if (topCategoryIcon) {
        topCategoryIcon.setAttribute("href", "#" + CATEGORY_META[topEntry.name].icon);
      }
    } else {
      if (topCategoryEl) topCategoryEl.textContent = "—";
      if (topCategoryMeta) topCategoryMeta.textContent = "Add expenses to see your top category";
    }

    return {
      total: total,
      monthTotal: monthTotal,
      monthCount: monthCount,
      previousMonthTotal: previousMonthTotal,
      categoryTotals: categoryTotals,
      topEntry: topEntry,
    };
  }

  function renderTransactions(expenses) {
    var list = byId("txList");
    var empty = byId("txEmpty");
    var count = byId("txCount");
    var showMore = byId("showMoreBtn");
    if (!list) return;

    if (count) {
      count.textContent = String(expenses.length);
      count.setAttribute(
        "aria-label",
        expenses.length + (expenses.length === 1 ? " transaction" : " transactions")
      );
    }

    list.replaceChildren();
    if (!expenses.length) {
      if (empty) empty.hidden = false;
      if (showMore) showMore.hidden = true;
      return;
    }

    if (empty) empty.hidden = true;

    var fragment = document.createDocumentFragment();
    expenses.slice(0, visibleCount).forEach(function (expense) {
      var meta = CATEGORY_META[expense.category];
      var item = document.createElement("li");
      item.className = "tx-item";

      var iconWrap = document.createElement("span");
      iconWrap.className = "tx-icon cat-" + meta.className;
      iconWrap.appendChild(createIcon(meta.icon));

      var main = document.createElement("span");
      main.className = "tx-main";
      var label = document.createElement("span");
      label.className = "tx-cat";
      label.textContent = expense.description || expense.category;
      var sub = document.createElement("span");
      sub.className = "tx-date";
      sub.textContent = expense.description
        ? expense.category + " · " + relativeDateLabel(expense.date)
        : relativeDateLabel(expense.date);
      main.append(label, sub);

      var amount = document.createElement("span");
      amount.className = "tx-amount";
      amount.textContent = "−" + formatMoney(expense.amount);

      item.append(iconWrap, main, amount);
      fragment.appendChild(item);
    });
    list.appendChild(fragment);

    if (showMore) {
      var remaining = expenses.length - visibleCount;
      showMore.hidden = remaining <= 0;
      if (remaining > 0) {
        showMore.textContent = "Show all " + expenses.length + " transactions";
        showMore.setAttribute("aria-controls", "txList");
      }
    }
  }

  function getLastSixMonths() {
    var now = new Date();
    var months = [];
    for (var offset = 5; offset >= 0; offset -= 1) {
      var date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      months.push({ date: date, total: 0, count: 0 });
    }
    return months;
  }

  function buildMonths(expenses) {
    var months = getLastSixMonths();
    expenses.forEach(function (expense) {
      months.forEach(function (month) {
        if (
          expense.date.getFullYear() === month.date.getFullYear() &&
          expense.date.getMonth() === month.date.getMonth()
        ) {
          month.total += expense.amount;
          month.count += 1;
        }
      });
    });
    return months;
  }

  function renderMonthlySummary(months) {
    var summary = byId("monthlySummary");
    var delta = byId("monthDelta");
    if (!summary) return;

    var current = months[months.length - 1];
    var previous = months[months.length - 2];

    if (!current.total && !previous.total) {
      summary.textContent = "No spending recorded in the last six months.";
      if (delta) {
        delta.textContent = "No data";
        delta.classList.remove("is-good", "is-bad");
      }
      return;
    }

    var text =
      "This month " +
      formatMoney(current.total) +
      (current.count
        ? " across " + current.count + (current.count === 1 ? " transaction." : " transactions.")
        : " so far.");

    if (previous.total) {
      var change = ((current.total - previous.total) / previous.total) * 100;
      var rounded = Math.round(Math.abs(change));
      if (rounded === 0) {
        text += " Level with last month.";
      } else if (change > 0) {
        text += " Up " + rounded + "% from last month.";
      } else {
        text += " Down " + rounded + "% from last month.";
      }
      if (delta) {
        delta.textContent = (change > 0 ? "Up " : "Down ") + rounded + "%";
        delta.classList.toggle("is-bad", change > 0);
        delta.classList.toggle("is-good", change < 0);
      }
    } else {
      text += " No spending recorded last month.";
      if (delta) {
        delta.textContent = "No prior month";
        delta.classList.remove("is-good", "is-bad");
      }
    }

    summary.textContent = text;
  }

  function renderMonthlyTable(months) {
    var details = byId("monthlyData");
    var body = byId("monthlyTableBody");
    if (!details || !body) return;
    var hasData = months.some(function (month) {
      return month.total > 0;
    });
    details.hidden = !hasData;
    body.replaceChildren();

    if (!hasData) return;
    months.forEach(function (month) {
      var row = document.createElement("tr");
      var monthCell = document.createElement("th");
      monthCell.scope = "row";
      monthCell.textContent = monthYearFormatter.format(month.date);
      var countCell = document.createElement("td");
      countCell.textContent = String(month.count);
      var amountCell = document.createElement("td");
      amountCell.textContent = formatMoney(month.total);
      row.append(monthCell, countCell, amountCell);
      body.appendChild(row);
    });
  }

  function renderCategoryChart(state) {
    var wrap = byId("categoryChartWrap");
    var canvas = byId("expenseChart");
    var empty = byId("categoryEmpty");
    var legend = byId("categoryLegend");
    if (!wrap || !canvas) return;

    var entries = Object.keys(state.categoryTotals)
      .map(function (name) {
        return { name: name, value: state.categoryTotals[name] };
      })
      .sort(function (a, b) {
        return b.value - a.value;
      });

    if (!entries.length) {
      wrap.hidden = true;
      if (empty) empty.hidden = false;
      if (legend) legend.replaceChildren();
      return;
    }

    wrap.hidden = false;
    if (empty) empty.hidden = true;

    var palette = getPalette();
    var total = entries.reduce(function (sum, entry) {
      return sum + entry.value;
    }, 0);
    var totalLabel = formatMoney(total);

    if (legend) {
      legend.replaceChildren();
      entries.forEach(function (entry) {
        var item = document.createElement("li");
        item.className = "legend-row";

        var dot = document.createElement("span");
        dot.className = "legend-dot";
        dot.style.background = palette.categories[entry.name] || palette.categories.Other;

        var name = document.createElement("span");
        name.className = "legend-name";
        name.textContent = entry.name;

        var value = document.createElement("span");
        value.className = "legend-value";
        value.textContent = formatMoney(entry.value);
        var share = document.createElement("small");
        share.textContent = formatShare(entry.value, total);
        value.appendChild(share);

        item.append(dot, name, value);
        legend.appendChild(item);
      });
    }

    canvas.setAttribute(
      "aria-label",
      "Spending by category. " +
        entries
          .map(function (entry) {
            return (
              entry.name +
              ": " +
              formatMoney(entry.value) +
              " (" +
              formatShare(entry.value, total) +
              ")"
            );
          })
          .join(", ") +
        ". Total: " +
        totalLabel +
        "."
    );

    if (typeof Chart === "undefined") {
      if (empty) {
        empty.hidden = false;
        empty.querySelector("h3").textContent = "Chart library unavailable";
        empty.querySelector("p").textContent =
          "The category values are listed in the legend.";
      }
      wrap.hidden = true;
      return;
    }

    Chart.defaults.font.family =
      '"Source Sans 3", ui-sans-serif, system-ui, "Segoe UI", sans-serif';
    Chart.defaults.font.size = 12;

    var centerText = {
      id: "centerText",
      afterDraw: function (chart) {
        var area = chart.chartArea;
        if (!area) return;
        var ctx = chart.ctx;
        var x = (area.left + area.right) / 2;
        var y = (area.top + area.bottom) / 2;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = palette.subtle;
        ctx.font = '500 10px "Source Sans 3", sans-serif';
        ctx.fillText("TOTAL", x, y - 12);
        ctx.fillStyle = palette.fg;
        ctx.font = '600 18px "Lexend", sans-serif';
        ctx.fillText(compactMoneyFormatter.format(total), x, y + 8);
        ctx.restore();
      },
    };

    var chart = new Chart(canvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: entries.map(function (entry) {
          return entry.name;
        }),
        datasets: [
          {
            data: entries.map(function (entry) {
              return entry.value;
            }),
            backgroundColor: entries.map(function (entry) {
              return palette.categories[entry.name] || palette.categories.Other;
            }),
            borderColor: palette.panel,
            borderWidth: 2,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        animation: reducedMotion ? false : { duration: 650 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: palette.tooltipBg,
            titleColor: palette.fg,
            bodyColor: palette.muted,
            borderColor: palette.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            displayColors: true,
            callbacks: {
              label: function (context) {
                return (
                  " " +
                  context.label +
                  ": " +
                  formatMoney(context.parsed) +
                  " (" +
                  formatShare(context.parsed, total) +
                  ")"
                );
              },
            },
          },
        },
      },
      plugins: [centerText],
    });
    charts.push(chart);
  }

  function renderMonthlyChart(months) {
    var wrap = byId("monthlyChartWrap");
    var canvas = byId("monthlyChart");
    if (!wrap || !canvas) return;

    var hasData = months.some(function (month) {
      return month.total > 0;
    });
    var empty = byId("monthlyEmpty");

    if (!hasData) {
      wrap.hidden = true;
      if (empty) empty.hidden = false;
      return;
    }
    wrap.hidden = false;
    if (empty) empty.hidden = true;

    if (typeof Chart === "undefined") {
      if (empty) {
        empty.hidden = false;
      }
      wrap.hidden = true;
      return;
    }

    var palette = getPalette();
    var labels = months.map(function (month) {
      return shortMonthFormatter.format(month.date);
    });
    var currentIndex = months.length - 1;

    canvas.setAttribute(
      "aria-label",
      "Bar chart of monthly spending. " +
        months
          .map(function (month) {
            return monthYearFormatter.format(month.date) + ": " + formatMoney(month.total);
          })
          .join(", ") +
        "."
    );

    var chart = new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Spent",
            data: months.map(function (month) {
              return month.total;
            }),
            backgroundColor: months.map(function (_, index) {
              return index === currentIndex ? palette.accent : palette.brand;
            }),
            borderRadius: 7,
            maxBarThickness: 42,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: reducedMotion ? false : { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: palette.tooltipBg,
            titleColor: palette.fg,
            bodyColor: palette.muted,
            borderColor: palette.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              title: function (items) {
                return monthYearFormatter.format(months[items[0].dataIndex].date);
              },
              label: function (context) {
                return formatMoney(context.parsed.y);
              },
              afterLabel: function (context) {
                var count = months[context.dataIndex].count;
                return count + (count === 1 ? " transaction" : " transactions");
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: palette.subtle, font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: palette.grid, drawTicks: false },
            border: { display: false },
            ticks: {
              color: palette.subtle,
              padding: 8,
              callback: function (value) {
                return "₹" + compactNumberFormatter.format(value);
              },
            },
          },
        },
      },
    });
    charts.push(chart);
  }

  function renderCharts(state) {
    charts.forEach(function (chart) {
      chart.destroy();
    });
    charts = [];
    renderCategoryChart(state);
    renderMonthlyChart(buildMonths(expenses));
  }

  function setupToast() {
    var toast = byId("toast");
    var close = byId("toastClose");
    var timer = null;
    if (!toast) return;

    function hideToast() {
      toast.classList.remove("is-visible");
      window.setTimeout(function () {
        toast.hidden = true;
      }, 260);
    }

    if (close) {
      close.addEventListener("click", hideToast);
    }

    window.showAppToast = function (message) {
      var messageNode = toast.querySelector("[data-toast-message]");
      if (messageNode) messageNode.textContent = message;
      toast.hidden = false;
      if (timer) window.clearTimeout(timer);
      window.requestAnimationFrame(function () {
        toast.classList.add("is-visible");
      });
      timer = window.setTimeout(hideToast, 4800);
    };

    var params = new URLSearchParams(window.location.search);
    if (params.get("added") === "1") {
      window.showAppToast("Expense added. Your dashboard is up to date.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }

  var expenses = loadExpenses();
  var transactions = expenses
    .slice()
    .sort(function (a, b) {
      return b.date - a.date || b.index - a.index;
    });

  renderGreeting();
  var state = renderStats(expenses);
  renderTransactions(transactions);

  var showMore = byId("showMoreBtn");
  if (showMore) {
    showMore.addEventListener("click", function () {
      visibleCount = transactions.length;
      renderTransactions(transactions);
      showMore.hidden = true;
    });
  }

  renderMonthlySummary(buildMonths(expenses));
  renderMonthlyTable(buildMonths(expenses));
  renderCharts(state);
  setupToast();

  window.addEventListener("themechange", function () {
    renderCharts(state);
  });
})();
