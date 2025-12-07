function getDateFilter(option) {
  const now = new Date();
  let start, end;

  switch (option) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;

    case "last-3-days":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
      end = now;
      break;

    case "last-week":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      end = now;
      break;

    case "last-month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      end = now;
      break;

    default:
      return null;
  }

  return { $gte: start, $lt: end };
}

module.exports = getDateFilter;
