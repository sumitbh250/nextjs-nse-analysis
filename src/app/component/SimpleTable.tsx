interface Column {
    key: string;
    label: string;
}

interface SimpleTableProps {
    columns: Column[];
    data: { [key: string]: any }[];
}

export default function SimpleTable({ columns, data }: SimpleTableProps) {
    return (
        <div className="overflow-x-auto">
            <div className="max-h-screen overflow-y-auto">
                <table
                    className="
                        min-w-full
                        border border-gray-300 dark:border-gray-700
                        divide-y divide-gray-200 dark:divide-gray-700
                    "
                >
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="
                                        px-6 py-3
                                        text-left text-sm
                                        font-semibold text-gray-900
                                        dark:text-gray-100
                                    "
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody
                        className="
                            divide-y divide-gray-200
                            dark:divide-gray-700
                        "
                    >
                        {data.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="
                                    hover:bg-gray-50
                                    dark:hover:bg-gray-700
                                "
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className="
                                            px-6 py-4
                                            whitespace-nowrap
                                            text-sm text-gray-700
                                            dark:text-gray-300
                                        "
                                    >
                                        {row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}