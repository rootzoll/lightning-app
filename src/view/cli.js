import React, { Component } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { SplitBackground } from '../component/background';
import { Header, Title } from '../component/header';
import Text from '../component/text';
import { Button, BackButton } from '../component/button';
import { createStyles, maxWidth } from '../component/media-query';
import { color, font, breakWidth } from '../component/style';

//
// CLI View
//

const styles = StyleSheet.create({
  header: {
    marginBottom: 1, // display separator above output background color
  },
});

const CLIView = ({ store, nav }) => (
  <SplitBackground color={color.blackDark} bottom={color.cliBackground}>
    <Header separator style={styles.header}>
      <BackButton onPress={() => nav.goSettings()} />
      <Title title="Logs" />
      <Button disabled onPress={() => {}} />
    </Header>
    <LogOutput logs={store.logs} />
  </SplitBackground>
);

CLIView.propTypes = {
  store: PropTypes.object.isRequired,
  nav: PropTypes.object.isRequired,
};

//
// Log Output
//

const baseLogStyles = {
  content: {
    flexGrow: 1,
    backgroundColor: color.cliBackground,
    paddingTop: 25,
    paddingBottom: 25,
    paddingLeft: 50,
    paddingRight: 50,
  },
  text: {
    fontSize: font.sizeS,
  },
};

const logStyles = createStyles(
  baseLogStyles,

  maxWidth(breakWidth, {
    content: {
      paddingLeft: 20,
      paddingRight: 20,
    },
  })
);

class LogOutput extends Component {
  constructor(props) {
    super(props);
    this._refresh = true;
    this._ref = React.createRef();
    this.state = {
      maxOffset: undefined,
    };
  }

  shouldComponentUpdate() {
    const current = this._refresh;
    this._refresh = false;
    setTimeout(() => {
      this._refresh = true;
    }, 100);
    if (!current) {
      clearTimeout(this._tLast);
      this._tLast = setTimeout(() => this.forceUpdate(), 500);
    }
    return current;
  }

  componentWillUnmount() {
    clearTimeout(this._tLast);
    clearInterval(this._tScroll);
  }

  get printLogs() {
    return this.props.logs;
  }

  onScroll(scrollEvent) {
    const offset = scrollEvent.nativeEvent.contentOffset.y;
    if (this.state.maxOffset === undefined || this.state.maxOffset <= offset) {
      this.setState({ maxOffset: offset - 10 });
      if (this._tScroll === undefined) {
        this._tScroll = setInterval(
          () => this._ref.current.scrollToEnd(),
          1000
        );
      }
    } else if (offset < this.state.maxOffset && this._tScroll) {
      clearInterval(this._tScroll);
      this._tScroll = undefined;
    }
  }

  render() {
    return (
      <ScrollView
        ref={this._ref}
        contentContainerStyle={logStyles.content}
        onScroll={event => this.onScroll(event)}
        scrollEventThrottle={300}
      >
        <Text style={logStyles.text}>{this.printLogs}</Text>
      </ScrollView>
    );
  }
}

LogOutput.propTypes = {
  logs: PropTypes.string.isRequired,
};

export default observer(CLIView);
