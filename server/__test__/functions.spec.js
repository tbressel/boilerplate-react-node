
const { getJsonResponse} = require('../functions');

describe('Test de la fonction getJsonResponse', () => {
    it('Devrait retourner une réponse JSON correcte', () => {

        // ARRANGE
        const mockConnection = null;
        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const mockNumber = 200;
        const mockResult = true || false;
        const mockMessageKey = 'success_message';
        const mockNotificationObject = {
            success_message: 'Opération réussie'
        };
        const mockRedirect = true || false;
        const mockResults = [{ id: 1, name: 'John' }];

        // ACT
        getJsonResponse(mockConnection, mockResponse, mockNumber, mockResult, mockMessageKey, mockNotificationObject, mockRedirect, mockResults);

        // ASSERT
        expect(mockResponse.status).toHaveBeenCalledWith(mockNumber);
        expect(mockResponse.json).toHaveBeenCalledWith({
            result: mockResult,
            type: mockMessageKey,
            message: mockNotificationObject[mockMessageKey],
            redirect: mockRedirect,
            body: mockResults
        });
    });
});


