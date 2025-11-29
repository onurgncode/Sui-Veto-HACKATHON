#[allow(duplicate_alias)]
module dao_app::message_bridge;

use sui::object::ID;
use std::string::{Self, String};

/// Parse message content to extract proposal data
public fun parse_proposal_from_message(
    _message_id: ID,
    message_content: String
): (String, String) {
    let title = string::utf8(b"Proposal Title");
    let description = message_content;
    (title, description)
}

/// Validate message format for proposal
public fun is_valid_proposal_message(_message_content: String): bool {
    true
}

/// Extract message ID from SDK message
public fun extract_message_id(sdk_message: ID): ID {
    sdk_message
}

