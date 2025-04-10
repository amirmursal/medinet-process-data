import React, { useState, useCallback } from "react";
import axios from "axios";
import QueryBuilder from "./QueryBuilder";
import styled from "styled-components";

// Styled Components
const Container = styled.div`
  max-width: 1000px;
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
  margin-top: 16px;
  color: #888;
`;

const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState<any>(null);

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
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      alert("Please enter a search term");
      return;
    }
    try {
      const response = await axios.post(`http://localhost:5000/search`, {
        search: searchTerm,
      });
      setData(response.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
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

  const handleEditRow = () => {
    // Implement edit functionality here
    alert("Edit functionality is not implemented yet.");
  };
  const handleDeleteRow = () => {
    // Implement delete functionality here
    alert("Delete functionality is not implemented yet.");
  };

  const handleGetQuery = useCallback((query: any) => {
    // Handle the query from QueryBuilder
    setSearchTerm(query);
    console.log("Query from QueryBuilder:", query);
    // You can send this query to your backend or use it as needed
  }, []);

  return (
    <Container>
      <Title>Upload XLS File</Title>

      <FileInput type="file" accept=".xls,.xlsx" onChange={handleFileChange} />
      <Button onClick={handleUpload}>Upload</Button>

      <Status>{status}</Status>

      <QueryBuilder getQuery={handleGetQuery} />
      <Button onClick={handleSearch}>GetData</Button>

      {data.length > 0 ? (
        <TableContainer>
          <h3>File Data:</h3>
          <StyledTable>
            <thead>
              <tr>
                <th>#</th>
                {Object.keys(data[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
                <th>Edit</th>
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
                  <td>
                    <button className="edit" onClick={() => handleEditRow()}>
                      Edit
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleDeleteRow()}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        </TableContainer>
      ) : (
        <NoDataText>No data found</NoDataText>
      )}
    </Container>
  );
};

export default App;
