# Kernel Specification

Description of the computation model used in a pins and curves environment.

---

## 1  Overview

The kernel is a discrete‑time transition system running in a host runtime.  
It owns an **array of FIFO queues** (called *threads*) that carry *units of work* originating from *modalities*.

Computation is triggered by modalities exclusively through the public call `push_workload`, which enqueues a **workload** (itself an array of queues) into a pending workload queue.  

The kernel then executes workloads *serially*: while one workload is active, later workloads accumulate but never mix.

The kernel is *extensible* through **side effect providers** that hook into various stages of the algorithm.

---

## 2  Glossary

**Modality ID**
Label of a modality
Formally: `Mid ∈ ℕ`

**Thread ID**
Label of a queue inside a workload 
Formally: `Tid ∈ ℕ`

**Unit** 
One work item
Formally: `Unit ≔ (kind, modalityId, payload)` where `kind ∈ {Worker, Install, Terminate}` or `Blocker(b_id,n)` with `b_id, n ∈ ℕ⁺`

**Workload**
An array of FIFO queues filled with units.
Formally: `Workload ≔ Tid ↦ Unit*`

**Plate**
The workload the kernel is currently operating on.

**front(Tid)**
Denotes the first unit in the plate.



---

## State Variables

```text
plate   : Workload      
pending : Queue of workloads
sideEffectProviders: Array of side effect providers
```

---

## Kernel Public API

```pseudocode
function step() {...}
function pushWorkload(workload) {...}
```

---

## Kernel pushWorkload Algorithm

```pseudocode
function pushWorkload(workload):
    workload ← sideEffectProviders.forEach(sideEffectProvider => sideEffectProvider.processReceivedWorkload());
    pending.enqueue(workload);
    sideEffectProviders.forEach(sideEffectProvider => sideEffectProvider.updateGlobalState(plate,pending));
    sideEffectProviders.forEach(sideEffectProvider => sideEffectProvider.workloadWasPushed());
```

---

## Kernel Step Algorithm

```pseudocode
function step:
    if plate.isEmpty() and not pending.isEmpty():
        plate ← pending.dequeue() 

    if plate.isEmpty():
        sideEffectProviders.forEach(sideEffectProvider => sideEffectProvider.updateGlobalState(plate,pending));
        sideEffectProviders.forEach(sideEffectProvider => sideEffectProvider.stepComplete());
        return;

    plate ← resolveBlockedThreads(plate)

    choose tid such that front(tid) is eligible

    u ← front(tid)

    Δplate ← modality(u.modalityId).process(u);
    plate ← merge(plate, Δplate)
    sideEffectProviders.forEach(sideEffectProvider => sideEffectProvider.updateGlobalState(plate,pending));
    sideEffectProviders.forEach(sideEffectProvider => sideEffectProvider.stepComplete());
```

---

## Choosing eligible threads:

A thread `tid` is considered eligible if `front(tid)` is not a blocker unit.

---

## Resolving blocked units

Blockers are queued as linked sets.
For instance, a push_workload call might queue 3 blockers with id `b_id`.
These blockers will reach maturity once all three blocker units are at the front of their respective threads.

The `resolveBlockedUnits` subroutine will scan all front units and identify sets of mature blocker units, which it will remove. It will do this recursively, until there are no more blocker units to resolve. 
At this point, it will hand back the cleaned plate.

---
