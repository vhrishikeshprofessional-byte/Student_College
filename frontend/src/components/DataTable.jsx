import { Eye } from "lucide-react";
import { Link } from "react-router-dom";

function titleize(key) {
  return key.replaceAll("_", " ");
}

export function formatValue(value) {
  if (value === null || value === undefined) {
    return "None";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "None";
    }
    if (value.every((item) => typeof item === "object")) {
      return value
        .map((item) => `${item.subject}: ${item.marks ?? item.subject_marks ?? "None"}`)
        .join(", ");
    }
    return value.join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${item}`)
      .join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

export default function DataTable({ rows, detailsBasePath, emptyMessage = "No records found" }) {
  if (!rows?.length) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{titleize(column)}</th>
            ))}
            {detailsBasePath && <th className="action-cell">View</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((column) => (
                <td key={column}>{formatValue(row[column])}</td>
              ))}
              {detailsBasePath && row.id && (
                <td className="action-cell">
                  <Link className="small-icon-link" to={`${detailsBasePath}/${row.id}`} title="View details">
                    <Eye size={16} aria-hidden="true" />
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
