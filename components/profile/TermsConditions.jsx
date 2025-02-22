import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const TermsConditions = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
           
            {/* Scrollable Terms Content */}
            <ScrollView style={styles.content}>
                <Text style={styles.sectionTitle}>Liability statement:</Text>
                <Text style={styles.text}>
                    THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO 
                    THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL 
                    THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
                    CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
                    IN THE SOFTWARE.
                </Text>
                <Text style={styles.text}>
                    The Owner of LetsCalm.com, LLC is not liable for any direct, indirect, incidental, consequential, or special damages 
                    arising out of or in connection with the use of copyrighted software, materials, including but not limited to errors, 
                    omissions, or inaccuracies in the content or loss or damage of any kind incurred as a result of the use of any 
                    copyrighted software, material, and application.
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    text: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 15,
    },
});

export default TermsConditions;
