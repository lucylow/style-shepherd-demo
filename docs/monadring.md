# Monadring

The Monadring protocol is an essential subprotocol within the Verisense ecosystem, designed to attain consensus for Nucleus operations. It is engineered to function effectively even in small-scale decentralized networks by leveraging an underlying blockchain network, specifically the Verisense Hostnet.

Our rigorous design and analysis of the Monadring protocol are documented in a paper available on arXiv. This document offers a concise overview of its foundational principles.

## Subnet Topology

Monadring defines a topological structure among network members, forming a ring where all members are connected end-to-end. This ring structure is established by the sorting of Verisense validators via submitted Verifiable Random Function (VRF) proofs as part of their candidacy.

## Token Circulation

Within a subnet, a token circulates periodically around the ring, granting state modification rights to the node currently holding it. Though the token structure is complex and detailed in our paper, it can be simplistically understood as containing:

- Each node's received events
- The current state
- Node signatures

When a node receives the token, it:
1. First executes events enclosed within, originating from other nodes
2. Then executes its own events
3. Adds its events to the token
4. Propagates it around the network

This ensures a globally recognized sequence of Nucleus events, defining the sequence of state modifications.

## Full Homomorphic Encryption (FHE)

A network relying solely on VRF for random member selection lacks inherent security. Thus, we introduce FHE to sign the states contained within the token, ensuring that nodes cannot view the processing results of others for specific events. 

By utilizing VRF for node selection and FHE for token signing, the subnet consensus mechanism simulates a Prisoner's Dilemma scenario. Even in small-scale networks, appropriately designed incentive strategies can enforce network security.

## Consensus on Network Requests

Nucleus state changes are abstractly referred to as events, akin to ledger-modifying transactions within traditional blockchains. Verisense enhances this with network request capabilities, necessitating special consensus treatment for such requests.

### Handling Network Requests

Network requests within a Nucleus are partitioned into two events:
1. **Request initiation**: Developers initiate a network request by calling an asynchronous function, returning a `request_id`
2. **Response reception**: Nodes dispatch the request while recording TLS handshake keys as parameters

Nodes execute events only when holding the token, ensuring a fair distribution of request execution across the network.

The consensus for request events is straightforward since given the same event sequence, all nodes generate a network request event. However, network request events within the token are not executed again, as their presence indicates prior execution by a token-holding node.

### Handling Network Response Events

HTTPS server certificates and shared handshake keys from the request-initiating node allow deterministic session key computation through the Diffie-Hellman handshake process. Only the node that issued the original request will receive a response. This HTTP response, encrypted with the session key, is set as a response event in the token and passed to other nodes. Upon receiving this event, nodes decrypt and execute it independently.

### Comparison to Other Networking Solutions

The following table compares Verisense's approach to network request consensus with other blockchain networking solutions:

| Solution | How it works | Limitations |
|----------|--------------|-------------|
| **Substrate Off-chain Worker** | A validator acts as an oracle, initiates I/O, and submits results via transactions. | Unverifiable and lacks true data activeness. |
| **ICP** | All nodes within a subnet initiate the same request then compare the result. | Only works with idempotent APIs. Fails with dynamic sources like LLMs or external chains. |
| **Regular Blockchain (passive) + zkTLS Oracle** | A zk-prover proves the TLS session and submits the result on-chain. | The zk-prover needs to pay for the gas, hence much less motivated. |
| **Verisense** | One validator sends a request; others verify it via TLS handshake. | Overcomes all above limitations. Suitable for most use cases (e.g., tweeting, uploading images, agent responses). Response time is already acceptable and will be optimized further. |

## Consensus on Timers

Timers present similar challenges due to their reliance on local system time and scheduling, which cannot be synchronized perfectly across all nodes. Thus, timers are divided into two events:

1. **Timer setup**: When a timer is scheduled
2. **Timer trigger**: When the timer fires

Within a subnet, only one node will actually trigger a scheduled timer; the rest will recognize the trigger through token transmission and disable their local timers upon receiving the event.

## Conclusion

The Monadring protocol enables Nucleus consensus, balancing flexibility and security in decentralized applications within Verisense. By organizing a strategic combination of VRF, FHE, and unique event handling mechanisms, Monadring supports secure and efficient consensus even in small networks.

### Further Reading

Detailed exploration of this protocol's intricacies can be found in our arXiv publication, complementing this overview with a deeper theoretical and technical foundation. The paper provides:

- Formal security analysis
- Performance benchmarks
- Detailed protocol specifications
- Implementation considerations

## Related Documentation

- [HTTP Requests](./http-requests.md) - Learn how to make network requests in your Nucleus
- [Timers](./timers.md) - Understand timer functionality and usage
- [KV Storage](./kv-storage.md) - Explore key-value storage operations

