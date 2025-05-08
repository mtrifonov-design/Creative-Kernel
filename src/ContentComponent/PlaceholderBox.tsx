
const production = false;
const base = production ? "https://mtrifonov-design.github.io/pinsandcurves-panels/#" : "http://localhost:5174/#";
const OPTIONS = {
    Timeline: base+"editing",
    "Code Editor": base+"code",
    Signals: base+"signals",
    "Preview": base+"p5",
    // Copilot: base+"copilot",
    // Assets: base+"assets",
}

function Option(p: {
    setAddress: (address: string) => void;
    label: string;
}) {
    return <div style={{
        backgroundColor: "#2C333A",
        color: "#C6D6E6",
        fontFamily: "sans-serif",
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
        backgroundColor: "#1D2126",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "10px",
    }}>
        <img src="/media/LOGO.svg"
            style={{
                width: "200px",
            }}
        />
        <div style={{
            color: "#C6D6E6",
            fontFamily: "sans-serif",
            fontSize: "16px",
            marginTop: "10px",
            marginBottom: "15px",
        }}>

        Welcome to Pins and Curves (beta)!<br></br>
        Open any of the panels below to get started.
        </div>
        <div style={{
            display: "flex",
            flexDirection: "row",
            gap: "10px",
        }}>
                {
                Object.keys(OPTIONS).map((key) => {
                    return <Option key={key} label={key} setAddress={p.setAddress} />
                })
            }

        </div>


    </div>
}


export default PlaceholderBox;