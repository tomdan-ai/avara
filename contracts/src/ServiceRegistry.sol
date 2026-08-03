// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ServiceRegistry
 * @notice On-chain registry of services that Avara agents can discover and purchase.
 * @dev Service providers register their services here. Each service has a price
 *      in a specified ERC-20 token (USDT for the MVP).
 */
contract ServiceRegistry is Ownable, Pausable {
    // ─── Types ───────────────────────────────────────────────────────────────

    struct Service {
        uint256 id;
        address provider;
        string name;
        string metadataURI;
        uint256 price;           // in token decimals (USDT = 6)
        address paymentToken;
        bool active;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 private _nextServiceId = 1;
    mapping(uint256 => Service) private _services;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ServiceRegistered(
        uint256 indexed serviceId,
        address indexed provider,
        string name,
        uint256 price,
        address paymentToken
    );

    event ServiceUpdated(uint256 indexed serviceId);
    event ServiceDeactivated(uint256 indexed serviceId);
    event ServiceActivated(uint256 indexed serviceId);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error ServiceNotFound(uint256 serviceId);
    error NotServiceProvider(uint256 serviceId, address caller);
    error InvalidPrice();
    error InvalidProvider();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── External functions ───────────────────────────────────────────────────

    /**
     * @notice Register a new service.
     * @param name Human-readable service name.
     * @param metadataURI URI pointing to service metadata (JSON).
     * @param price Price per request in payment token units.
     * @param paymentToken ERC-20 token accepted as payment.
     * @return serviceId The assigned service ID.
     */
    function registerService(
        string calldata name,
        string calldata metadataURI,
        uint256 price,
        address paymentToken
    ) external whenNotPaused returns (uint256 serviceId) {
        if (price == 0) revert InvalidPrice();
        if (paymentToken == address(0)) revert InvalidProvider();

        serviceId = _nextServiceId++;

        _services[serviceId] = Service({
            id: serviceId,
            provider: msg.sender,
            name: name,
            metadataURI: metadataURI,
            price: price,
            paymentToken: paymentToken,
            active: true
        });

        emit ServiceRegistered(serviceId, msg.sender, name, price, paymentToken);
    }

    /**
     * @notice Update service metadata or price. Only the provider can call this.
     */
    function updateService(
        uint256 serviceId,
        string calldata metadataURI,
        uint256 price
    ) external {
        Service storage svc = _getExistingService(serviceId);
        if (svc.provider != msg.sender && owner() != msg.sender) {
            revert NotServiceProvider(serviceId, msg.sender);
        }
        if (price == 0) revert InvalidPrice();

        svc.metadataURI = metadataURI;
        svc.price = price;

        emit ServiceUpdated(serviceId);
    }

    /**
     * @notice Deactivate a service. Only provider or owner.
     */
    function deactivateService(uint256 serviceId) external {
        Service storage svc = _getExistingService(serviceId);
        if (svc.provider != msg.sender && owner() != msg.sender) {
            revert NotServiceProvider(serviceId, msg.sender);
        }
        svc.active = false;
        emit ServiceDeactivated(serviceId);
    }

    /**
     * @notice Re-activate a service. Only provider or owner.
     */
    function activateService(uint256 serviceId) external {
        Service storage svc = _getExistingService(serviceId);
        if (svc.provider != msg.sender && owner() != msg.sender) {
            revert NotServiceProvider(serviceId, msg.sender);
        }
        svc.active = true;
        emit ServiceActivated(serviceId);
    }

    // ─── View functions ───────────────────────────────────────────────────────

    function getService(uint256 serviceId) external view returns (Service memory) {
        return _getExistingService(serviceId);
    }

    function isServiceActive(uint256 serviceId) external view returns (bool) {
        return _services[serviceId].active;
    }

    function getServicePrice(uint256 serviceId) external view returns (uint256) {
        return _getExistingService(serviceId).price;
    }

    function getServiceProvider(uint256 serviceId) external view returns (address) {
        return _getExistingService(serviceId).provider;
    }

    function totalServices() external view returns (uint256) {
        return _nextServiceId - 1;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _getExistingService(uint256 serviceId) internal view returns (Service storage) {
        Service storage svc = _services[serviceId];
        if (svc.id == 0) revert ServiceNotFound(serviceId);
        return svc;
    }
}
