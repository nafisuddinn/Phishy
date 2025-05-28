import { useEffect, useState } from 'react';

function ScanHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; /*max number of rows per page*/

  useEffect(() => {
    const userId = localStorage.getItem("phishy-user-id");

    fetch(`http://127.0.0.1:8000/history/${userId}`)
      .then(res => res.json())
      .then(data => {
        setHistory(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading history:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading scan history...</p>;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = history.slice(startIndex, endIndex); /*slice only outputs the start index and ends before the stated end index*/

  const totalPages = Math.ceil(history.length / itemsPerPage);

  return (
    <div className="history">
      <h2>My Scan History</h2>
      {history.length === 0 ? (
        <p>No past scans found.</p>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Message</th>
                  <th>Type</th>
                  <th>Chance of Scam</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((scan) => (
                  <tr key={scan.id}>
                    <td>{new Date(scan.timestamp).toLocaleString()}</td>
                    <td>{scan.message.slice(0, 50)}...</td> {/*starts at the index 0, and ends at 49*/}
                    <td>{scan.type}</td>
                    <td>{scan.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span> 
            <button
              onClick={() => setCurrentPage(prev => (endIndex < history.length ? prev + 1 : prev))}
              disabled={currentPage === totalPages} /* Next button, disabled if on last page */
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ScanHistory;
