
const base = "http://localhost:5174/"
const OPTIONS = {
    Editing: base+"editing",
    Code: base+"code",
    Signals: base+"signals",
    P5: base+"p5",
}

function Option(p: {
    setAddress: (address: string) => void;
    label: string;
}) {
    return <div style={{
        border: " 1px solid rgb(150, 150, 150)",
        borderRadius: "5px",
        padding: "10px",
        fontSize: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
    }} onClick={() => {
        p.setAddress(OPTIONS[p.label]);
    }}>{p.label}</div>
}


function PlaceholderBox(p: {
    setAddress: (address: string) => void;
}) {
    return <div style={{
        backgroundColor: "rgb(240, 240, 240)",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "10px",
    }}>{
        Object.keys(OPTIONS).map((key) => {
            return <Option key={key} label={key} setAddress={p.setAddress} />
        })
    }
    </div>
}


export default PlaceholderBox;