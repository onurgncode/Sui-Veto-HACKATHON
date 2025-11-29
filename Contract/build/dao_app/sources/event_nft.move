#[allow(duplicate_alias)]
module dao_app::event_nft;

use sui::object::{UID, ID};
use sui::transfer;
use sui::tx_context::TxContext;

public struct EventNFT has key {
    id: UID,
    commity_id: ID,
    xp: u64,
    owner: address,
}

/// Mint an event NFT that can be redeemed for XP
public fun mint(
    commity_id: ID,
    xp: u64,
    recipient: address,
    ctx: &mut TxContext
): EventNFT {
    EventNFT {
        id: object::new(ctx),
        commity_id,
        xp,
        owner: recipient,
    }
}

/// Mint and transfer an event NFT to a recipient
#[allow(lint(public_entry))]
public entry fun mint_and_transfer(
    commity_id: ID,
    xp: u64,
    recipient: address,
    ctx: &mut TxContext
) {
    let nft = mint(commity_id, xp, recipient, ctx);
    transfer::transfer(nft, recipient);
}

/// Get the ID of an event NFT
public fun id(nft: &EventNFT): ID {
    object::id(nft)
}

/// Get the community ID of an event NFT
public fun commity_id(nft: &EventNFT): ID {
    nft.commity_id
}

/// Get the XP value of an event NFT
public fun xp(nft: &EventNFT): u64 {
    nft.xp
}

/// Get the owner of an event NFT
public fun owner(nft: &EventNFT): address {
    nft.owner
}

/// Check if an address owns the NFT
public fun is_owner(nft: &EventNFT, addr: address): bool {
    nft.owner == addr
}

/// Destroy an event NFT
public fun destroy(nft: EventNFT) {
    let EventNFT { id, commity_id: _, xp: _, owner: _ } = nft;
    object::delete(id);
}

