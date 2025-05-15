import React from "react";
import { CK_Unit } from "../kernel/types";

interface UnitDetailsProps {
    selectedUnit: CK_Unit | null;
    firstUnit: CK_Unit | undefined;
}

const UnitDetails: React.FC<UnitDetailsProps> = ({ selectedUnit, firstUnit }) => {
    return (
        <div
            style={{
                width: "300px",
                marginLeft: "20px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor: "#f9f9f9",
            }}
        >
            <h2>Unit Details</h2>
            {selectedUnit || firstUnit ? (
                <pre>{JSON.stringify(selectedUnit || firstUnit, null, 2)}</pre>
            ) : (
                <p>No units available</p>
            )}
        </div>
    );
};

export default UnitDetails;
