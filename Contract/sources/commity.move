#[allow(duplicate_alias)]
module dao_app::commity;

use sui::object::{UID, ID};
use sui::transfer;
use sui::tx_context::TxContext;
use std::string::String;
use sui::dynamic_field as df;

/// Community structure with dynamic field for membership
public struct Commity has key {
    id: UID,
    name: String,
}

/// Create a new community
#[allow(lint(public_entry))]
public entry fun create(name: String, ctx: &mut TxContext) {
    let commity = Commity {
        id: object::new(ctx),
        name,
    };
    transfer::share_object(commity);
}

/// Get the ID of a community
public fun id(commity: &Commity): ID {
    object::id(commity)
}

/// Get the name of a community
public fun name(commity: &Commity): String {
    commity.name
}

/// Add a member to the community
public fun add_member(commity: &mut Commity, member: address) {
    if (!df::exists_<address>(&commity.id, member)) {
        df::add<address, bool>(&mut commity.id, member, true);
    };
}

/// Check if an address is a member of a community
public fun is_member(commity: &Commity, member: address): bool {
    if (df::exists_<address>(&commity.id, member)) {
        *df::borrow<address, bool>(&commity.id, member)
    } else {
        false
    }
}

/// Remove a member from the community
public fun remove_member(commity: &mut Commity, member: address) {
    if (df::exists_<address>(&commity.id, member)) {
        df::remove<address, bool>(&mut commity.id, member);
    };
}

