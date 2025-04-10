import React, { useState, useEffect, useCallback } from "react";

import styled from "styled-components";

// Container
const QueryBuilderContainer = styled.div`
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

// Header
const Title = styled.h2`
  font-size: 20px;
  margin-bottom: 16px;
`;

// Each condition row
const ConditionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
`;

// Selects and Input
const Select = styled.select`
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 150px;
`;

const Input = styled.input`
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 150px;
`;

// Buttons
const Button = styled.button`
  padding: 6px 12px;
  background-color: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background-color: #005ea2;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  &.remove {
    background-color: #e81123;

    &:hover {
      background-color: #c50f1f;
    }
  }
`;

const allFields = ["Patient_Name", "Chart_ID"];

const operators = ["equals", "contains"]; // add more operators as needed "greater than", "less than"

type Condition = {
  field: string;
  operator: string;
  value: string;
};

type QueryBuilderProps = {
  getQuery: (query: Record<string, unknown>) => void;
};

const QueryBuilder = ({ getQuery }: QueryBuilderProps) => {
  const [conditions, setConditions] = useState<Condition[]>([
    { field: allFields[0], operator: "equals", value: "" },
  ]);

  const updateCondition = (
    index: number,
    key: keyof Condition,
    value: string
  ) => {
    const updated = [...conditions];
    updated[index][key] = value;
    setConditions(updated);
  };

  const addCondition = () => {
    const unusedFields = allFields.filter(
      (f) => !conditions.map((c) => c.field).includes(f)
    );
    const nextField = unusedFields[0] || "";
    setConditions([
      ...conditions,
      { field: nextField, operator: "equals", value: "" },
    ]);
  };

  const removeCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    setConditions(updated);
  };

  const buildMongoQuery = useCallback(() => {
    const query = conditions.map(({ field, operator, value }) => {
      switch (operator) {
        case "equals":
          return { [field]: isNaN(Number(value)) ? value : Number(value) };
        case "contains":
          return { [field]: { $regex: value, $options: "i" } };
        case "greater than":
          return { [field]: { $gt: Number(value) } };
        case "less than":
          return { [field]: { $lt: Number(value) } };
        default:
          return {};
      }
    });
    return { $and: query };
  }, [conditions]);

  // ✅ Only run getQuery when conditions change
  useEffect(() => {
    const query = buildMongoQuery();
    getQuery(query);
  }, [buildMongoQuery, conditions, getQuery]);

  return (
    <QueryBuilderContainer>
      <Title>Query Builder</Title>
      {conditions.map((cond, index) => {
        const selectedFields = conditions.map((c, i) => i !== index && c.field);
        const availableFields = allFields.filter(
          (field) => !selectedFields.includes(field) || field === cond.field
        );

        return (
          <ConditionRow key={index}>
            <Select
              value={cond.field}
              onChange={(e) => updateCondition(index, "field", e.target.value)}
            >
              {availableFields.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </Select>

            <Select
              value={cond.operator}
              onChange={(e) =>
                updateCondition(index, "operator", e.target.value)
              }
            >
              {operators.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </Select>

            <Input
              type="text"
              value={cond.value}
              onChange={(e) => updateCondition(index, "value", e.target.value)}
              placeholder="Value"
            />

            {conditions.length > 1 && (
              <Button className="remove" onClick={() => removeCondition(index)}>
                Remove
              </Button>
            )}
          </ConditionRow>
        );
      })}

      <Button
        onClick={addCondition}
        disabled={conditions.length >= allFields.length}
      >
        Add Condition
      </Button>
    </QueryBuilderContainer>
  );
};

export default QueryBuilder;
