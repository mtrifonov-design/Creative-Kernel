type CK_Unit = {
    threadId: string;
    execute: (units: CK_Units) => [symbol[], {[unitId: symbol]: CK_Unit }];
    dependencies: symbol[];
}

type CK_Units = {
    [unitId: symbol]: CK_Unit;

}

function execute(units : CK_Units,unitId:symbol) {
    const unit = units[unitId];
    if (!unit) {
        throw new Error("Unit not found");
    }
    const [units_to_delete,units_to_add] = unit.execute(units);
    // remove the units that are not needed anymore
    for (const unitId of units_to_delete) {
        delete units[unitId];
    }
    // update the dependencies of old units on deleted units
    for (const unitId of Object.keys(units)) {
        const unit = units[unitId];
        if (unit) {
            unit.dependencies = unit.dependencies.filter((dep : symbol) => !units_to_delete.includes(dep));
        }
    }
    // add the new units
    for (const unitId of Object.keys(units_to_add)) {
        const unit = units_to_add[unitId];
        if (unit) {
            units[unitId] = unit;
        }
    }
    return units;
}


function run(units: CK_Units, selector: (units: [symbol, CK_Unit][]) => [symbol, CK_Unit] | undefined) {
    const symbols = Object.getOwnPropertySymbols(units);
    const unit_entries = symbols.map((symbol) => {
        const unit = units[symbol];
        return [symbol,unit];
    }) as [symbol,CK_Unit][];

    // scan for units without dependencies
    let candidate_units = unit_entries.filter(([unitId,unit]: [symbol,CK_Unit]) => {
        return unit.dependencies.length === 0;
    })

    // execute the first candidate unit
    const candidate = selector(candidate_units);
    if (!candidate) {
        // no more units to execute
        return units;
    }
    const [unitId,unit] = candidate;
    units = execute(units,unitId);

    return run(units, selector);
}


