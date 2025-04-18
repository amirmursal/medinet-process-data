import React, { useState, useCallback, useRef } from "react";
import axios from "axios";
import QueryBuilder from "./QueryBuilder";
import styled from "styled-components";

// Styled Components
const Container = styled.div`
  margin: 0 auto;
  padding: 20px;
  font-family: "Segoe UI", sans-serif;
`;

const Title = styled.h2`
  font-size: 24px;
  margin-bottom: 16px;
`;

const FileInput = styled.input`
  margin-bottom: 16px;
`;

const Button = styled.button`
  background-color: #0078d4;
  color: white;
  border: none;
  padding: 8px 16px;
  margin: 8px 8px 16px 0;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #005ea2;
  }
`;

const Status = styled.span`
  display: block;
  margin-bottom: 16px;
  color: green;
`;

const TableContainer = styled.div`
  overflow-x: auto;
  margin-top: 24px;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  min-width: 600px;

  th,
  td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
    font-size: 14px;
  }

  th {
    background-color: #f4f4f4;
    font-weight: bold;
  }

  tr:nth-child(even) {
    background-color: #fafafa;
  }

  button {
    background-color: #e81123;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background-color: #c50f1f;
    }

    &.edit {
      background-color: #107c10;

      &:hover {
        background-color: #0b6a0b;
      }
    }
  }
`;

const NoDataText = styled.span`
  display: block;
  color: #888;
`;

// Container
const UploadContainer = styled.div`
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 10px;
`;

const DataContainer = styled.div`
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 10px;
`;

const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setStatus(response.data.message);
      setIsLoading(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    if (!searchTerm) {
      alert("Please enter a search term");
      return;
    }
    try {
      const response = await axios.post(`http://localhost:5000/search`, {
        search: searchTerm,
      });
      setData(response.data.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return ""; // Handle empty values

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date"; // Handle invalid dates

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // const handleEditRow = () => {
  //   // Implement edit functionality here
  //   alert("Edit functionality is not implemented yet.");
  // };
  const handleDeleteRow = async (id: string) => {
    const data = await axios.delete(`http://localhost:5000/delete/`, {
      data: { id },
    });
    if (data.status === 200) {
      // Display a success message or update the UI as needed
      alert("Row deleted successfully.");
      handleSearch();
    }
  };

  const handleGetQuery = useCallback((query: any) => {
    // Handle the query from QueryBuilder
    setSearchTerm(query);
    console.log("Query from QueryBuilder:", query);
    // You can send this query to your backend or use it as needed
  }, []);

  const handleDownload = async () => {
    try {
      if (!tableRef.current) return;
      setIsLoading(true);
      const tableHtml = tableRef.current.outerHTML;
      const tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Sheet1</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <meta charset="UTF-8">
        </head>
        <body>
          ${tableHtml}
        </body>
      </html>
    `;
      const blob = new Blob([tableHTML], {
        type: "application/vnd.ms-excel",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "table-data.xls";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsLoading(false);
    } catch (error) {
      console.error("Error downloading file:", error);
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <UploadContainer>
        <Title>Upload XLS File</Title>

        <FileInput
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileChange}
        />
        <Button onClick={handleUpload}>Upload</Button>

        <Status>{status}</Status>
      </UploadContainer>

      <QueryBuilder getQuery={handleGetQuery} />
      <DataContainer>
        <Button onClick={handleSearch}>GetData</Button>
        <Button onClick={handleDownload}>Download Data</Button>
        {isLoading && <Status>Loading...</Status>}
        {data.length > 0 && !isLoading ? (
          <TableContainer>
            <h3>File Data:</h3>
            <StyledTable ref={tableRef}>
              <thead>
                <tr>
                  <th>#</th>
                  {Object.keys(data[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                  {/* <th>Edit</th> */}
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    {Object.entries(row).map(([key, value], i) => (
                      <td key={i}>
                        {key.includes("Date") || key === "Month"
                          ? formatDate(value as string)
                          : String(value)}
                      </td>
                    ))}
                    {/* <td>
                    <button className="edit" onClick={() => handleEditRow()}>
                      Edit
                    </button>
                  </td> */}
                    <td>
                      {/*//@ts-ignore*/}
                      <button onClick={() => handleDeleteRow(row._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </TableContainer>
        ) : (
          <NoDataText>No data found</NoDataText>
        )}
      </DataContainer>
    </Container>
  );
};

export default App;
